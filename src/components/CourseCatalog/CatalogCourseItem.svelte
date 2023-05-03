<script lang="ts">
import type { Lesson, _CourseData } from "../../types";

export let course: _CourseData;
export let added: boolean;
export let toggleAddedState: () => void;
export let alwaysShowDetails: boolean = false;
export let conflictsWithSelected: boolean;

const startsAtEight = course.lessons.some(l => l.ordinal === 1);
const endsPastFive = course.lessons.some(l => (l.ordinal + l.span - 1) > 9);
const takesPlaceOnWeekend = course.lessons.some(l => l.dayOfWeek > 5);
const needsToRescheduleLunch = course.lessons.some(l => l.ordinal === 5 || (l.ordinal < 5 && (l.ordinal + l.span - 1) >= 5));

const url = `https://portalfun.yzu.edu.tw/cosSelect/Cos_Plan.aspx?y=${course.year}&s=${course.semester}&id=${course.id}&c=${course.klz}`;

let shouldShowDetails = false;

function dowReadable(dow: number) {
    return '星期' + (['一','二','三','四','五','六','日'][dow - 1] ?? '?');
}

const numberInChinese = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四'];

function spanReadable(start: number, span: number) {
    let nums = [];

    for (let i = start; i <= (start + span - 1); i++) {
        nums.push(numberInChinese[i - 1]);
    }

    return '第' + nums.join('、') + '節';
}

function lessonToReadable(lesson: Lesson) {
    let ret = dowReadable(lesson.dayOfWeek);
    ret += spanReadable(lesson.ordinal, lesson.span);
    if (lesson.location) {
        ret += ' 在 ' + lesson.location;
    }
    return ret;
}
</script>

<style>
.catalog-course-item {
    margin-bottom: 1em;
    border: 1px solid rgba(0, 0, 0, .2);
    border-radius: 4px;
    padding: 8px 16px;
}

.catalog-course-item .tags {
    margin-bottom: 8px;
}

.catalog-course-item .tags span {
    background: #d5cdbe;
    border: 1px solid rgb(175, 134, 58);
    padding: 4px;
    padding-top: 2px;
    border-radius: 4px;
    font-size: 85%;
}

.you-might-wanna-rethink {
    background: rgba(110, 83, 34, 0.158);
}

.selected {
    background: rgba(73, 180, 127, 0.274);
}

.catalog-secondary {
    color: #333;
    font-size: 85%;
}

.course-name {
    margin-top: 4px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    flex-direction: row;
}

.course-name a {
    font-size: unset;
    color: royalblue;
    text-decoration: none;
    display: inline-block;
}

.course-details h5 {
    margin-top: 1em;
    font-size: 1em;
}
.course-details ul {
    margin-top: 8px;
    padding-inline-start: 20px;
    font-size: .9em;
}

.catalog-course-item .toggle {
    visibility: hidden;
    float:right;
}

.catalog-course-item:hover .toggle {
    visibility: visible;
}
</style>


<div class="catalog-course-item" class:selected={added} class:you-might-wanna-rethink={startsAtEight || endsPastFive || takesPlaceOnWeekend || needsToRescheduleLunch || conflictsWithSelected || course.taughtInEnglish}>
    <button class="toggle btn btn-outline-dark" on:click={toggleAddedState} >{ added ? '-' : '+' }</button>

    {#if startsAtEight || endsPastFive || takesPlaceOnWeekend || needsToRescheduleLunch || conflictsWithSelected || course.taughtInEnglish}
    <div class="tags">
        {#if startsAtEight} <span>早八</span> {/if}
        {#if endsPastFive} <span>超過五點</span> {/if}
        {#if takesPlaceOnWeekend} <span>假日</span> {/if}
        {#if needsToRescheduleLunch} <span>午餐再見</span> {/if}
        {#if conflictsWithSelected} <span>跟已選衝堂</span> {/if}
        {#if course.taughtInEnglish} <span>英語授課</span> {/if}
    </div>
    {/if}
    <div class="catalog-secondary">
        {course.friendlyId}<br />
        {#if true}
        {course.hostingDepartment} · {numberInChinese[Number(course.forDegree) - 1]}年級<br/>
        {/if}
        {course.selectionAttribute} · {course.teacher}
        
        {#if typeof course.credit !== 'undefined'}
        <br>學分數：{course.credit}
        {/if}
        {#if typeof course.maximumEnrollments !== 'undefined'}
        <br>選課人數上限：{course.maximumEnrollments}
        {/if}
    </div>
    <div class="course-name" on:click={() => shouldShowDetails = !shouldShowDetails}>
        {course.name}
        <a href={url} class="material-icons" target="_blank">open_in_new</a>
    </div>
    <div class="catalog-secondary">
        {course.selectionNotes}
    </div>
    {#if course.lessons.length || alwaysShowDetails}
        <div class="course-details">
            <h5>課程時間</h5>
            <ul>
            {#each course.lessons as l, index (index)}
                <li>{lessonToReadable(l)}</li>
            {/each}
            </ul>
        </div>
    {/if}
</div>