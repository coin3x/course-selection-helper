<script lang="ts">    
    import TimeTable from './components/TimeTableD/TimeTable.svelte'    
    import CourseList from './components/CouseListD/CourseList.svelte'
    import {candidateCourseIds, selectedCourseIds, selectedCourseRefs, departments, rawSelectedDepartment, currentViewingCourse, selectedSemester as sem} from './stores'
    import { onMount } from "svelte";
    import { findDuplicates, useEffect } from './utils';
    import type { Department } from './types';
    import { concat } from 'fp-ts/lib/ReadonlyNonEmptyArray';
    import { map } from 'fp-ts/lib/Functor';
    import { trim } from 'fp-ts/lib/string';
    import CourseCatalog from './components/CourseCatalog/CourseCatalog.svelte';
    import CourseDetails from './components/CourseCatalog/CourseDetails.svelte';

    let displaySerNo = false;
    let displayCourseCatalog = false;
    let selectedSemester = null;
    $: console.log(displaySerNo)

    let editCandidateCourses = "";
    let editSelectedCourses = "";
    let fsMsg = '正在載入';

    onMount(async()=>{
        candidateCourseIds.useLocalStorage()
        selectedCourseIds.useLocalStorage()
        rawSelectedDepartment.useLocalStorage()

        let qs = new URLSearchParams(location.search);
        let semesterFromQs = qs.get('semester');
        let semesters = await fetch('semesters.json').then(r => r.json());
        if (semesterFromQs) selectedSemester = semesters.find(s => s.includes(semesterFromQs));
        if (!selectedSemester) selectedSemester = semesters[0];
        $sem = selectedSemester;
    })

    $: useEffect(() => {
        if (!selectedSemester) return;
        (async function() {
            try {
                let _departments = (await fetch(selectedSemester).then(r => r.json())) as Department[];
                departments.set(_departments);
            } catch (e) {
                console.error(e);
                fsMsg = '無法載入課程清單';
            }
        })();
    }, () => [selectedSemester])

    function deselectActiveElement() {
        (document.activeElement as any).blur()
    }

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
            <div class="form-check form-switch" on:click={deselectActiveElement}>
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
            <button class="btn btn-outline-dark" on:click={() => displayCourseCatalog = true}>瀏覽課程</button>
        </div>
        <div class="list-container">
            <div class="list-label">待選課程</div>
            <div class="list-label">已選課程</div>
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