<script lang="ts">
import { allCourses, candidateCourseIds, currentViewingCourse, selectedCourseIds, selectedCourses } from '../../stores';
import { checkConflict } from '../../utils';
import CatalogCourseItem from './CatalogCourseItem.svelte';

export let onClose: () => void;

$: course = $allCourses.find(c => c.friendlyId === $currentViewingCourse)
$: inCandidate = $candidateCourseIds.some(c => c === course.friendlyId);
$: inSelected = $selectedCourseIds.some(c => c === course.friendlyId);
$: added = inCandidate || inSelected;
$: conflicts = checkConflict(course, $selectedCourses);
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
</style>
<div class="dialog-wrapper" on:click={onClose}>
    <div class="catalog-card" on:click={(ev) => ev.stopPropagation()}>
        <h3>課程資訊</h3>
        <CatalogCourseItem
            course={course}
            added={added}
            conflictsWithSelected={conflicts}
            toggleAddedState={() => {
                if (added) {
                    if (inCandidate) candidateCourseIds.update(ids => ids.filter(id => id !== course.friendlyId))
                    if (inSelected) selectedCourseIds.update(ids => ids.filter(id => id !== course.friendlyId))
                } else {
                    candidateCourseIds.update(ids => ids.concat(course.friendlyId))
                }
            }}
        />
    </div>
</div>