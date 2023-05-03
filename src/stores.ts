import { derived, Readable, Writable, writable } from 'svelte/store';
import { writableDerived } from 'svelte-writable-derived';
import type { CourseList, Department, _CourseData } from './types';
import { persistentWritable, versionedPersistentWritable } from './utils';

const sampleCourses = ["CS106A"]

export let selectedSemester = writable('');

export let oldRawSelectedDepartment = persistentWritable<string>("selectedDepartment", 'all');
export let oldCandidateCourseIds  = persistentWritable<CourseList>("candidateCourses", []) //writable<CourseList>([]);
export let oldSelectedCourseIds   = persistentWritable<CourseList>("selectedCourses", sampleCourses);
export const hasMigratedToVersionedData = persistentWritable<boolean>('migration.versionedData', false);
const allSelectedDepartment = versionedPersistentWritable<{ [key: string]: string }>('selectedDepartmentV2', {});
const allCandidateCourseIds = versionedPersistentWritable<{ [semester: string]: CourseList }>('candidateCoursesV2', {});
const allSelectedCourseIds = versionedPersistentWritable<{ [semester: string]: CourseList }>('selectedCoursesV2', {});
export const rawSelectedDepartment = writableDerived(
    [selectedSemester, allSelectedDepartment],
    ([sem, d]) => {
        if (sem && d[sem]) {
            return d[sem];
        }
        return 'all';
    },
    (newD, [sem, allD]) => {
        allD[sem] = newD;
        return [sem, allD] as any;
    },
    'all',
);
export const candidateCourseIds = writableDerived(
    [selectedSemester, allCandidateCourseIds],
    ([sem, c]) => {
        if (sem && c[sem]) {
            return c[sem];
        }
        return [];
    },
    (newC, [sem, allC]) => {
        allC[sem] = newC;
        return [sem, allC] as any;
    },
    [],
);
export const selectedCourseIds = writableDerived(
    [selectedSemester, allSelectedCourseIds],
    ([sem, s]) => {
        if (sem && s[sem]) {
            return s[sem];
        }
        return sampleCourses;
    },
    (newS, [sem, allS]) => {
        allS[sem] = newS;
        return [sem, allS] as any;
    },
    sampleCourses,
);

export const useVersionedLocalStorageForSemesterSegmentedWritables = () => {
    allCandidateCourseIds.useVersionedLocalStorage(1, (prevVer, prevData) => ({ success: false }));
    allSelectedCourseIds.useVersionedLocalStorage(1, (prevVer, prevData) => ({ success: false }));
    allSelectedDepartment.useVersionedLocalStorage(1, (prevVer, prevData) => ({ success: false }));
}

export const departments = writable<Department[]>([]);
export const hoveringCourseId = writable<string | null>(null);
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

export let selectedCourseRefs = writable({} as {
    [key: string]: HTMLElement
} )
