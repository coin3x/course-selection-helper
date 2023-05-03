<script lang="ts">    
    import TimeTable from './components/TimeTableD/TimeTable.svelte'    
    import CourseList from './components/CouseListD/CourseList.svelte'
    import {candidateCourseIds, selectedCourseIds, selectedCourseRefs, departments, rawSelectedDepartment, currentViewingCourse, selectedSemester as sem, useVersionedLocalStorageForSemesterSegmentedWritables, oldRawSelectedDepartment, oldSelectedCourseIds, oldCandidateCourseIds, hasMigratedToVersionedData} from './stores'
    import { onMount } from "svelte";
    import { findDuplicates, useEffect } from './utils';
    import type { Department } from './types';
    import CourseCatalog from './components/CourseCatalog/CourseCatalog.svelte';
    import CourseDetails from './components/CourseCatalog/CourseDetails.svelte';

    function formatSemester(sem: string) {
        sem = sem.split('/').find(seg => seg.toLowerCase().includes('.json')) ?? sem;
        sem = sem.split('.')[0];
        return `${sem.slice(0, -1)}-${sem.slice(-1)}`;
    }
    let displaySerNo = false;
    let displayCourseCatalog = false;

    let editCandidateCourses = "";
    let editSelectedCourses = "";
    let fsMsg = '正在載入';
    let semesters = [];

    onMount(async()=>{
        oldCandidateCourseIds.useLocalStorage()
        oldSelectedCourseIds.useLocalStorage()
        oldRawSelectedDepartment.useLocalStorage()
        hasMigratedToVersionedData.useLocalStorage();

        useVersionedLocalStorageForSemesterSegmentedWritables();
        semesters = await fetch('semesters.json').then(r => r.json());
        $sem = semesters[0];
        if (!$hasMigratedToVersionedData) {
            $candidateCourseIds = $oldCandidateCourseIds;
            $selectedCourseIds = $oldSelectedCourseIds;
            $rawSelectedDepartment = $oldRawSelectedDepartment;
            $hasMigratedToVersionedData = true;
        }
    })

    useEffect(() => {
        if (!$sem) return;
        (async function() {
            try {
                departments.set([]);
                let _departments = (await fetch($sem).then(r => r.json())) as Department[];
                departments.set(_departments);
            } catch (e) {
                console.error(e);
                fsMsg = '無法載入課程清單';
            }
        })();
    }, () => [$sem])

    function deselectActiveElement() {
        (document.activeElement as any).blur()
    }

    const handleSemesterChange = (e) => {
        displaySerNo = false;
        $sem = (e.target as HTMLSelectElement).value;
    };

</script>

<style>
    .Main {
        height: 100vh;
        display: grid;  
        overflow: hidden;  
        grid-template-columns: 25em 1fr;        
    }
    .list-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto 1fr;
        flex: 1 1 auto;
        overflow-y: hidden;
    }

    .left-area {
        display: flex;
        flex-direction: column;
        overflow-y: hidden;        
    }

    textarea {
        resize: none;
        overflow-y: scroll;
        border: 1px black solid;
    }

    .fullscreen-message {
        display: grid;
        place-content: center;
        height: 100%;
    }
    .top-actions {
        display: flex;
        align-items: center;
        padding: 8px;
    }
    .top-actions .btn {
        margin-left: 16px;
    }
    .list-label {
        background-color: rgb(0 0 0 / 5%);
        padding: 8px;
        text-align: center;
    }
    .list-label sup {
        padding: 4px;
        cursor: help;
    }
    .right-area {
        overflow-y: auto;
    }
</style>

<!-- <SortableList bind:items let:item>
    Test123 {item}
</SortableList> -->
{#if $departments.length}
<div class="Main">
    <div class="left-area">
        <div class="top-actions">
            <span>學期：
                <select value={$sem} on:change={handleSemesterChange}>
                    {#each semesters as semester}
                    <option value={semester}>{formatSemester(semester)}</option>
                    {/each}
                </select>
            </span>
            <button class="btn btn-outline-dark" on:click={() => displayCourseCatalog = true}>瀏覽課程</button>
            <div class="form-check form-switch" on:click={deselectActiveElement} style="margin-left: 1em">
                <input class="form-check-input shadow-none" type="checkbox" id="switchSerNo" 
                    bind:checked={displaySerNo} 
                    on:change={(e)=> {
                        if(displaySerNo){
                            // list -> textarea
                            editCandidateCourses = $candidateCourseIds.join("\n")
                            editSelectedCourses = $selectedCourseIds.join("\n")
                        }else{
                            // textarea -> list
                            const _candidateCourses = editCandidateCourses.split('\n').filter( x => x.length>=1 ).map( x => x.trim() )
                            const _selectedCourses = editSelectedCourses.split('\n').filter( x => x.length>=1 ).map(x => x.trim())
                            const duplicatedItem = findDuplicates(_candidateCourses.concat(_selectedCourses))
                            if(duplicatedItem.length >= 1){
                                alert(`Duplicated Item: ${duplicatedItem}`)
                                displaySerNo = true
                            }else{
                                $candidateCourseIds = _candidateCourses
                                $selectedCourseIds = _selectedCourses
                            }
                        }
                    }}
                >
                <label class="form-check-label" for="switchSerNo">編輯模式</label>
            </div>
        </div>
        <div class="list-container">
            <div class="list-label">待選課程<sup title="剛從課程清單加入的課程，你可以把課程拖到已選裡面">?</sup></div>
            <div class="list-label">已選課程<sup title="已選的課程會顯示在右邊的課表上，你可以檢查有沒有衝堂">?</sup></div>
            {#if !displaySerNo}
                <CourseList bind:courseList={$candidateCourseIds}/>
                <CourseList bind:refs={$selectedCourseRefs} bind:courseList={$selectedCourseIds}/>
            {:else}
                <textarea class="form-control" bind:value={editCandidateCourses}/>
                <textarea class="form-control" bind:value={editSelectedCourses}/>
            {/if}            
        </div>    
    </div>
    <div class="right-area">
        
        <TimeTable />
    </div>
    {#if displayCourseCatalog}
        <CourseCatalog onClose={() => displayCourseCatalog = false} />
    {/if}
    {#if $currentViewingCourse}
        <CourseDetails onClose={() => $currentViewingCourse = null} />
    {/if}
</div>
{:else}
<div class="fullscreen-message">{fsMsg}</div>
{/if}