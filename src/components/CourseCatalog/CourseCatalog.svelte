<script lang="ts">
import { allCourses, candidateCourseIds, departments, selectedCourseIds, selectedCourses, selectedDepartment, rawSelectedDepartment } from '../../stores';
import { KeywordFilterMode } from '../../types';
import type { _CourseData, KeywordFilterConfig, Department } from '../../types';
import { checkConflict } from '../../utils';
import CatalogCourseItem from './CatalogCourseItem.svelte';
import KeywordFilter from './KeywordFilter.svelte';

export let onClose: () => void;

let shouldHideConflictedCourses = false;
let shouldTruncateLongList = true;
let keywordFilters: KeywordFilterConfig[] = [];
let selectedDegree = 'all';

function addNewKeywordFilter() {
    keywordFilters = keywordFilters.concat({
        keyword: '',
        mode: KeywordFilterMode.Include,
    });
}

function filterCoursesWithDepartmentAndDegree(courses: _CourseData[], department: Department | null | undefined, degree: string) {
    let c = courses;
    if (department) c = department.courses;
    if (degree !== 'all') c = c.filter(el => el.forDegree === degree);
    return c;
}

$: validFilters = keywordFilters.filter(config => config.keyword.trim().length !== 0);
$: _selectedDepartment = $departments.find(d => d.id === $selectedDepartment)
$: validDegree = _selectedDepartment ? [...new Set([..._selectedDepartment.courses.map(c => c.forDegree)])].sort() : ['1', '2', '3', '4'];
$: baselineCourses = filterCoursesWithDepartmentAndDegree($allCourses, _selectedDepartment, selectedDegree)
$: filteredCourses = baselineCourses.filter(c => {
    function match(mode: KeywordFilterMode, keyword: string, target: string) {
        if (mode === KeywordFilterMode.Include) {
            return target.includes(keyword);
        } else if (mode === KeywordFilterMode.Exclude) {
            return !target.includes(keyword);
        }
        throw new Error('Unknown filter mode: ' + mode);
    }
    // if (!c.lessons.some(l => l.dayOfWeek == 5 && l.ordinal == 6)) return false;

    const targets = [c.name, c.hostingDepartment, c.teacher, c.selectionNotes, c.selectionAttribute, c.friendlyId];

    const inclusionFilters = validFilters.filter(f => f.mode === KeywordFilterMode.Include);
    const exclusionFilters = validFilters.filter(f => f.mode === KeywordFilterMode.Exclude);
    let hasMatch = false;
    for (const {mode, keyword} of inclusionFilters) {
        const matches = targets.some(s => match(mode, keyword, s));
        if (matches) {
            hasMatch = true;
            break;
        }
    }
    if (inclusionFilters.length && !hasMatch) return false;
    for (const {mode, keyword} of exclusionFilters) {
        const passed = targets.every(s => match(mode, keyword, s));
        if (!passed) {
            return false;
        }
    }
    if (shouldHideConflictedCourses) {
        if (checkConflict(c, $selectedCourses)) return false;
    }
    return true;
}).map(course => {
    const inCandidate = $candidateCourseIds.some(c => c === course.friendlyId);
    const inSelected = $selectedCourseIds.some(c => c === course.friendlyId);
    const added = inCandidate || inSelected;
    const conflicts = shouldHideConflictedCourses
        ? false
        : checkConflict(course, $selectedCourses);
    return {
        ...course,
        added,
        conflicts,
        inCandidate,
        inSelected,
    }
});

$: truncated = shouldTruncateLongList && filteredCourses.length > 200
$: theFinalList = truncated ? filteredCourses.slice(0, 200) : filteredCourses

</script>
    
<style>
.dialog-wrapper {
    height: 100%;
    width: 100%;
    position: fixed;
    z-index: 100;
    background: rgb(0 0 0 / 75%);
    overflow-y: auto;
}

.catalog-card {
    max-width: 40em;
    background: white;
    box-shadow: 1px 1px 15px 1px rgba(0, 0, 0, .2);
    margin: 3em auto;
    border-radius: 4px;
    padding: 17px 34px;
}

.catalog-course-filters {
    margin-bottom: 16px;
}

.catalog-course-filters .filter-row {
    padding: 4px 0;
}
</style>

<div class="dialog-wrapper" on:click={onClose}>
    <div class="catalog-card" on:click={(ev) => ev.stopPropagation()}>
        <h3>課程列表</h3>
        <div class="catalog-course-filters">
            <div class="filter-row">
                開課系所：
                <select bind:value={$rawSelectedDepartment} on:change={() => {shouldTruncateLongList = true; selectedDegree = 'all'}}>
                    <option value="all">全部</option>
                    {#each $departments as department}
                        <option value={department.id} disabled={!department.courses.length}>
                            {department.name}
                        </option>
                    {/each}
                </select>
                <div style="margin-left: 8px; display: inline-block">
                    <input
                        type="checkbox"
                        id="catalog-hide-conflict"
                        bind:checked={shouldHideConflictedCourses}
                    />
                    <label for="catalog-hide-conflict">隱藏衝堂</label>
                </div>
            </div>
            <div class="filter-row">
                年級：
                <select bind:value={selectedDegree} on:change={() => shouldTruncateLongList = true}>
                    <option value="all">全部</option>
                    {#each validDegree as d}
                        <option value={d}>
                            {d}
                        </option>
                    {/each}
                </select>
            </div>
            關鍵字篩選：<button class="btn btn-outline-dark" on:click={addNewKeywordFilter}>+</button>
            {#each keywordFilters as config, idx (idx)}
                <KeywordFilter
                    config={config}
                    onConfigChange={(newConfig) => {
                        const copy = keywordFilters.slice(0);
                        copy.splice(idx, 1, newConfig);
                        keywordFilters = copy;
                    }}
                    onDelete={()=>{
                        keywordFilters = keywordFilters.slice(0, idx).concat(keywordFilters.slice(idx + 1));
                    }}
                />
            {/each}
        </div>
        {#if !filteredCourses.length}
            沒有符合指定條件的項目
        {/if}
        {#each theFinalList as course (course.friendlyId)}
            <CatalogCourseItem
                course={course}
                added={course.added}
                conflictsWithSelected={course.conflicts}
                toggleAddedState={() => {
                    if (course.added) {
                        if (course.inCandidate) candidateCourseIds.update(ids => ids.filter(id => id !== course.friendlyId))
                        if (course.inSelected) selectedCourseIds.update(ids => ids.filter(id => id !== course.friendlyId))
                    } else {
                        candidateCourseIds.update(ids => ids.concat(course.friendlyId))
                    }
                }}
            />
        {/each}
        {#if truncated}
            還有 {filteredCourses.length - 200} 門課程 <button class="btn btn-outline-dark" on:click={()=>shouldTruncateLongList = false}>全部顯示</button>
        {/if}
    </div>
</div>