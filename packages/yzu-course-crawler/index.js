const { JSDOM } = require('jsdom');
const { fetch } = require('@adobe/helix-fetch');
const { PromisePool } = require('@supercharge/promise-pool')
const qs = require('qs');
const { writeFileSync, existsSync } = require('fs');
const readline = require('readline');

const pageUrl = 'https://portalfun.yzu.edu.tw/cosSelect/index.aspx?D=G';
// 有必要嗎
const CourseInfoAPIURL = Buffer.from('aHR0cHM6Ly9pc2RuYTEueXp1LmVkdS50dy9TdGRTZWxXZWJBUEkvYXBpL1NlbENvcy9HZXRfQ29zSW5mb19Db21fR2xvYmFsX0RU', 'base64');
const noCourseString = '無課程資料！';

const Names = {
	YearSem: 'DDL_YM',
	Dept: 'DDL_Dept',
	Degree: 'DDL_Degree',
	EventTarget: '__EVENTTARGET',
	SubmitButton: 'Button1',
}

const Values = {
	SubmitButton: '確定',
}

const defaultHeaders = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36',
}

async function getCourse({targetYearSem, course}) {
	let res = await fetch(CourseInfoAPIURL, {
		method: 'POST',
		body: qs.stringify({
			sYear: targetYearSem.trim().split(',')[0],
			sSmtr: targetYearSem.trim().split(',')[1],
			sCos_id: course.id,
			sCos_class: course.klz,
			sCosTerm_id: '1',
			sLanguage: 'TW',
		}),
		follow: 0,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	}).then(res => res.json());
	if (res.length !== 1) {
		throw new Error('cannot get course info');
	}
	return res[0];
}

const htmlToDocument = (html) => {
	let { window } = new JSDOM(html);
	let document = window.document;
	return document;
};

function getFormData(form) {
	let data = {
		Q: 'RadioButton1',
	};
	for (let input of form.querySelectorAll('input[name]')) {
		if (input.name === 'Q' || input.name === Names.SubmitButton) continue;
		data[input.name] = input.getAttribute('value') ?? '';
	}
	return data;
}

function parseCourses(html) {
	let document = htmlToDocument(html);
	let Node = document.defaultView.Node;
	let lines = document.querySelectorAll('#Table1 tr');
	if ((lines.length - 1) % 2 !== 0) {
		alert('what')
		throw false;
	}
	let courses = [];

	for (let i = 1; i < lines.length; i += 2) {
		let $mainRow = lines[i];
		let $noteRow = lines[i + 1];

		let $link = $mainRow.children[1].firstElementChild;
		if ($link.tagName !== 'A') {
			console.error('should be a link, got', $link);
			throw new Error();
		}
		let match = $link.getAttribute('href').match(/y=([^&]+)&s=([^&]+)&id=([^&]+)&c=([^&]+)/);
		if (!match) throw new Error('match not found')
		let [_, year, semester, id, klz] = match;
		let hostingDepartment = $mainRow.children[2].textContent.trim();
		let forDegree;
		{
			let match = hostingDepartment.match(/ (\d)年級$/)
			hostingDepartment = hostingDepartment.replace(match[0], '');
			forDegree = match[1];
		}
		let name = $mainRow.children[3].querySelector('a').textContent;
		let taughtInEnglish = $mainRow.children[3].textContent.includes('*英語授課');
		let selectionAttribute = $mainRow.children[4].textContent.trim();

		let $time = $mainRow.children[5].firstElementChild;
		let lessons = [];
		for (let node of $time.childNodes) {
			if (node.nodeType !== Node.TEXT_NODE) continue;
			let splitted = node.textContent.split(',');
			let location = (splitted.length === 1) ? null : splitted[1];
			let time = parseInt(splitted[0].trim(), 10);
			if (Number.isNaN(time)) continue;
			if (time < 101 || time > 700) {
				console.warn('Detected unusual time:', time);
				continue;
			}
			let dayOfWeek = Math.floor(time / 100);
			let ordinal = time % 100;
			if (ordinal < 1 || ordinal > 14) {
				console.warn('Detected unusual ordinal:', ordinal);
				continue;
			}
			lessons.push({
				dayOfWeek,
				ordinal,
				span: 1,
				location,
			});
		}
		lessons.sort(({ordinal: a}, {ordinal: b}) => a - b);
		lessons.sort(({dayOfWeek: a}, {dayOfWeek: b}) => a - b);

		// Combine consecutive lessons
		lessons = lessons.reduce(
			(acc, current) => {
				if (!acc.length) return acc.concat(current);
				let lastIndex = acc.length - 1;
				let last = acc[lastIndex];
				if (last.dayOfWeek === current.dayOfWeek
					&& last.location === current.location
					&& last.ordinal + last.span === current.ordinal
				) {
					return acc
						.slice(0, lastIndex /* exclusive */)
						.concat({
							...last,
							span: last.span + current.span,
						});
				}
				return acc.concat(current);
			},
			[],
		);

		let teacher = $mainRow.children[6].textContent.trim();
		let $selectionNotes = $noteRow.querySelector('td');
		let selectionNotes;
		if ($selectionNotes.childNodes.length > 1) {
			// We may have encountered this:
			// td [ text(broken, with the same string repeated), br, correct message]
			let array = Array.from($selectionNotes.childNodes);
			let brIdx = array.findIndex(node => node.tagName === 'BR');
			let textNodeAfterBr = array.find((node, idx) => node.nodeType === Node.TEXT_NODE && idx > brIdx);
			if (textNodeAfterBr) {
				selectionNotes = textNodeAfterBr.textContent.trim();
			}
		}
		if (!selectionNotes) {
			selectionNotes = $selectionNotes.textContent.trim();
		}

		courses.push({
			friendlyId: id + klz,
			id,
			year,
			semester,
			klz,
			name,
			lessons,
			teacher,
			selectionAttribute,
			selectionNotes,
			hostingDepartment,
			forDegree,
			taughtInEnglish,
		});
	}
	return courses;
}


/**
 type Department = {
	id: string, // '304'
	name: string, // '資訊工程學系學士班',
	courses: Course[],
 }
 */


async function main() {
	let initialFormData;
	let departments = [];
	let targetYearSem;
	{
		let res = await fetch(pageUrl, {
			headers: {
				...defaultHeaders,
			},
			follow: 0,
		}).then(r => r.text());
		let doc = htmlToDocument(res);
		initialFormData = getFormData(doc.querySelector('#form1'));
		let yss = Array.from(doc.getElementById(Names.YearSem).querySelectorAll('option'))
			.filter(ys => ['1', '2'].includes(ys.value.trim().slice(-1)));
		let ys = (process.argv.length > 2)
			? (yss.find(ys => process.argv[2].includes(ys.value.trim())) ?? yss[0])
			: yss[0];
		console.log(`Selected ${ys.textContent.trim()} (${ys.getAttribute('value')})`);
		targetYearSem = ys.getAttribute('value');
		for (let opt of doc.getElementById(Names.Dept).querySelectorAll('option')) {
			departments.push({
				name: opt.textContent.trimEnd(),
				id: opt.getAttribute('value'),
				courses: [],
			});
		}
	}
	let fileName = targetYearSem.trim().replace(/,/g, '') + '.json';
	if (existsSync(fileName) && !process.argv.some(arg => arg === '-f')) {
		console.error(`File ${fileName} already exists. Use -f to overwrite.`);
		process.exit(1);
	}
	let {errors} = await PromisePool
		.for(departments)
		.withConcurrency(4)
		.process(async (department) => {
			console.log(`Fetching courses for ${department.name.trim()} (${department.id})`);
			// do postback because we love webforms
			let formData;
			{
				let res = await fetch(pageUrl, {
					method: 'POST',
					body: qs.stringify({
						...initialFormData,
						[Names.YearSem]: targetYearSem,
						[Names.Dept]: department.id,
						[Names.Degree]: '1', // The default value
						[Names.EventTarget]: Names.Dept,
					}),
					headers: {
						...defaultHeaders,
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}).then(r => r.text());
				let doc = htmlToDocument(res);
				formData = getFormData(doc);
			}
			let res = await fetch(pageUrl, {
				method: 'POST',
				body: qs.stringify({
					...formData,
					[Names.YearSem]: targetYearSem,
					[Names.Dept]: department.id,
					[Names.Degree]: '0', // All
					[Names.SubmitButton]: Values.SubmitButton,
				}),
				headers: {
					...defaultHeaders,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				follow: 0,
			}).then(r => r.text());

			if (!res.includes(noCourseString)) {
				department.courses = parseCourses(res);
			}
			console.log(`  ...found ${department.courses.length} courses for department ID ${department.id}.`);
		});
	if (errors.length) {
		console.error(errors);
		throw new Error('Failed to fetch departments');
	}
	let allCourses = departments.flatMap(department => department.courses);
	let creditDataFilled = false;
	try {
		await getCourse({ targetYearSem, course: allCourses[0] });
		creditDataFilled = true;
	} catch {}
	if (creditDataFilled) {
		console.log(`Fetching credit info and maximum enrollments for ${allCourses.length} courses.`);
		await PromisePool
			.for(allCourses)
			.withConcurrency(4)
			.onTaskFinished((course, pool) => {
				readline.clearLine(process.stderr);
				readline.cursorTo(process.stderr, 0);
				process.stderr.write(`[${pool.processedItems().length}/${allCourses.length}] Fetched ${course.friendlyId}`);
			})
			.process(async (course) => {
				let info = await getCourse({ targetYearSem, course });
				if (info.credit) {
					course.credit = Number(info.credit);
				}
				if (info.max_std) {
					course.maximumEnrollments = Number(info.max_std);
				}
			})
		console.error('');
	} else {
		console.log(`Skipping fetching credit info and maximum enrollments because the data haven't been filled.`)
	}
	writeFileSync(fileName, JSON.stringify(departments, null, 2));
	console.log(`Saved to ${fileName}.`);
}
main();
