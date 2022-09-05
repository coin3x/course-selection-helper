<script lang="ts">
  import Footer from '../Footer.svelte';

import GridCell from "./GridCell.svelte"
import { allCourses, selectedCourseIds } from "../../stores";
import type { SerNo } from "../../types";
import { array } from 'fp-ts'
import { pipe } from 'fp-ts/lib/function'
import { cellWidth } from "../../consts";
import { debug } from "svelte/internal";
import { getMaxArraySize } from "../../utils";
const rows = ['一', '二', '三', '四', '五', '六']
const columns = ['0','1','2','3','4','5','6','7','8','9','10','A','B','C','D']
const 節次to時間 = {
    "0" :	"07:10 - 08:00",
    "1" :	"08:10 - 09:00",
    "2" :	"09:10 - 10:00",
    "3" :	"10:10 - 11:00",
    "4" :	"11:10 - 12:00",
    "5" :	"12:10 - 13:00",
    "6" :	"13:10 - 14:00",
    "7" :	"14:10 - 15:00",
    "8" :	"15:10 - 16:00",
    "9" :	"16:10 - 17:00",
    "10":	"17:10 - 18:00",
    "A" :	"18:30 - 19:20",
    "B" :	"19:30 - 20:20",
    "C" :	"20:30 - 21:20",
    "D" :	"21:30 - 22:20?"
}

$: console.log("owo",$selectedCourseIds)



$: sortedCourses = (()=>{
    let arr
    // SerNo, TimeSection index
    : ([SerNo, number] | "PlaceHolder" )[][][]
    = [...Array(rows.length)].map( _ => [...Array(columns.length)].map( _ => [] ) ) 
    
    for (const serNo of $selectedCourseIds) {                    
        const course = $allCourses.find(c => c.friendlyId === serNo)
        if(!course) continue;
        for (const [lessonIdx, { dayOfWeek, ordinal, span }] of course.lessons.entries()) {
            const level =
            pipe(
                Array.from( Array(span).keys()),
                array.map( x => arr[dayOfWeek - 1][ordinal + x].length ), 
                array.reduce(0 ,Math.max)
            )

            arr[dayOfWeek - 1][ordinal][level] = [serNo, lessonIdx]
    
            for (let i = 0; i < span; i++) { 
                for (let j = 0; j < level+1; j++) {
                    if(!arr[dayOfWeek - 1][ordinal + i][j]){
                        arr[dayOfWeek - 1][ordinal + i][j] = "PlaceHolder"
                    }
                }
            }
        }
        
    }    
    console.log("sortedCourse updated", arr)
    return arr    
    
})()

$: _rows = rows.map( (x, i) => ({
    name: x, 
    h: Math.max(120, getMaxArraySize(sortedCourses[i])*40+5)
}))

</script>


<style>
    table {
        overflow: auto; 
        height: auto;
        white-space: nowrap;
        border-collapse: collapse;
        table-layout: fixed;
        display: block;
    }
    tbody > tr {
        height: 10em;      
        border-bottom: 1px solid;  
        overflow-y: scroll;
    }    
    
    td {
        min-width: 8em;
        border-right: 1px solid;
    }

    tr > th:not(thead > tr > :first-child){
        background-color: lightgray;
    }

    th {        
        text-align: center;
    }

    thead tr th {
        position: -webkit-sticky; /* for Safari */
        position: sticky;
        top: 0;
        background-color: lightgray;
        z-index: 2;        
    }
    
    tbody th {
        position: -webkit-sticky; /* for Safari */
        position: sticky;
        left: 0;
        background-color: lightgray;
        max-width: 1em;
        z-index: 2;        
    }

    thead th:first-child {
        left: 0;
        z-index: 3;
        background-color: white;
        min-width: 2em; 
    }

    .wrapper {
        overflow-y: auto;
    }

</style>

<div class="wrapper">
    <table>    
        <thead>
            <tr>
                <th>
                    
                </th>
                {#each columns as columnName, i}
                    {#if i}
                    <th>                                        
                        {columnName}
                        <br>
                        <small>  {節次to時間[columnName]} </small>
                    </th>
                    {/if}
                {/each}
            </tr>
        </thead>
        <tbody>
        {#each _rows as {name, h}, i}
            <tr style="width: {columns.length * cellWidth} em; height: {h}px">
                <th style="height: {h}px">
                    {name}
                </th>
                {#each columns as _, j}
                    {#if j}
                    <td style="height: {h}px">                                    
                        <GridCell v={sortedCourses[i][j]} height={h} />
                    </td>
                    {/if}
                {/each}
            </tr>
        {/each}
        </tbody>
    </table>
    <Footer />
</div>