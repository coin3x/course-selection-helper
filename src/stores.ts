import { derived, Readable, Writable, writable } from 'svelte/store';
import type { CourseDisplayStatus, CourseList, Department, _CourseData } from './types';
import { persistentWritable, writableFamily } from './utils';

const sampleCandidateCourses = ["CS106A"]

export let rawSelectedDepartment = persistentWritable<string>("selectedDepartment", 'all');
export let candidateCourseIds  = persistentWritable<CourseList>("candidateCourses", []) //writable<CourseList>([]);
export let selectedCourseIds   = persistentWritable<CourseList>("selectedCourses", sampleCandidateCourses);
export const departments = writable<Department[]>([]);
export let currentViewingCourse = writable<string | null>(null);
export let selectedDepartment = derived([rawSelectedDepartment, departments], ([r, d], set) => {
    if (r === 'all' || !d.some(({id}) => id === r)) {
        set('all');
    } else {
        set(r);
    }
}, 'all');

export const allCourses = derived<Writable<Department[]>, _CourseData[]>(departments, (depts, set) => {
    set(depts.flatMap(d => d.courses))
}, []);
export const candidateCourses = derived<[Readable<_CourseData[]>, Readable<string[]>], _CourseData[]>([allCourses, candidateCourseIds], ([courses, ids], set) => {
    set(courses.filter(c => ids.includes(c.friendlyId)));
}, []);
export const selectedCourses = derived<[Readable<_CourseData[]>, Readable<string[]>], _CourseData[]>([allCourses, selectedCourseIds], ([courses, ids], set) => {
    set(courses.filter(c => ids.includes(c.friendlyId)));
}, []);

export let courseDisplayStatuses = writableFamily<string, CourseDisplayStatus>(
    {
        isHighlighting: false
    }
)

export let selectedCourseRefs = writable({} as {
    [key: string]: HTMLElement
} )

export let selectedSemester = writable("");