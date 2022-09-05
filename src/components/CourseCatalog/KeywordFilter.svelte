<script lang="ts">
import { KeywordFilterMode } from "../../types";
import type { KeywordFilterConfig } from "../../types";


export let config: KeywordFilterConfig;
export let onConfigChange: (newConfig: KeywordFilterConfig) => void;
export let onDelete: () => void;

let currentMode = config.mode;
let currentKeyword = config.keyword;

function handleChange() {
    onConfigChange({
        mode: currentMode,
        keyword: currentKeyword,
    });
}

</script>

<div>
    <button on:click={onDelete}>-</button>
    <select bind:value={currentMode} on:change={handleChange}>
        <option value={KeywordFilterMode.Include}>包含</option>
        <option value={KeywordFilterMode.Exclude}>不包含</option>
    </select>
    <input placeholder="關鍵字" bind:value={currentKeyword} on:input={handleChange} />
</div>
