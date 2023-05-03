<script lang="ts">
    import type { SerNo } from "../../types";
    import { allCourses, hoveringCourseId } from "../../stores";
    export let self;
    export let serNo: SerNo;
    export let deleteItem;
    const course = $allCourses.find(c => c.friendlyId === serNo)
    $: backgroundColor =
        course
            ? $hoveringCourseId === serNo
                ? '#C8EBFB'
                : 'none'
            : 'red'
</script>

<style>
    .ListItem {
        position: relative;
        display: block;
        padding: .75rem .5rem;
        margin-bottom: -1px;
        /* background-color: #fff;  */
        border: 1px solid rgba(0,0,0,.125);
        /* font-size: smaller; */
        user-select: none;
    }
    button {
        vertical-align: middle;
    }
</style>

<div class="ListItem" data-id={serNo}
    style={`background-color : ${backgroundColor};`}
    bind:this={self}
    on:mouseenter={()=> $hoveringCourseId = serNo}
    on:mouseleave={()=> $hoveringCourseId = null}
>
    <button on:click={() => deleteItem(serNo)} >
        <span class="material-icons">
            clear
        </span>
    </button>    
    {#if course}
        {course.name}    
        <br>
        <small style="float: left"> {serNo} </small>    
        <small style="float: right"> {course.teacher} </small>
    {:else}
        {serNo}
    {/if}    
</div>