<script lang="ts">
import { onMount } from "svelte";

import { cellWidth } from "../../consts";

import { allCourses, currentViewingCourse, hoveringCourseId, selectedCourseRefs } from "../../stores";

import type { SerNo } from "../../types";
    
export let serNo    : SerNo;
export let sectionId: number;
export let nth      : number; 


const course = $allCourses.find(c => c.friendlyId === serNo)
const length = course.lessons[sectionId].span

// onMount( () => console.log("CourseBar", serNo) )
$: backgroundColor = $hoveringCourseId === serNo ? 'deeppink' : 'rgb(89, 151, 26)'

</script>

<style>
    .CourseBar {
        position: absolute;
        color: white;
        border-radius: 5px;            
        z-index: 1;
        padding-left: 3px;
        margin-left: 2px;        
    }
</style>

<!-- background-color: {status.isHighlighting ? 'red' : 'green'} -->
<div 
    class="CourseBar" 
    style={`
    top: ${(nth * 40 + 5)}px; 

    width: ${(length * cellWidth -0.3)}em; 
    background-color: ${backgroundColor}`}
    on:mouseenter={()=> $hoveringCourseId = serNo}
    on:mouseleave={()=> $hoveringCourseId = null}
    on:click={(e) => {
        if (e.altKey)
            $selectedCourseRefs[serNo].scrollIntoView({behavior: 'smooth'})
        else
            $currentViewingCourse = serNo
    }}
>
 {serNo + " " + course.name} 
</div>



