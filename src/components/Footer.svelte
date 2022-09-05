<script lang="ts">
import { selectedSemester } from '../stores';

function formatSemester(sem) {
    sem = sem.split('.')[0];
    return `${sem.slice(0, -1)}-${sem.slice(-1)}`;
}
</script>

<style>
footer {
    font-size: .9em;
    padding: 2em 1em;
    background: rgb(231, 231, 231);
}
</style>

<footer>
    <p>
    修改自 <a href="https://github.com/koru1130/course-selection-helper">course-selection-helper</a>。原作者：<a href="https://github.com/koru1130">koru1130</a>，專案沒寫授權資訊
    </p>
    
    <h6 style="font-size: 1em">不寫不會有人知道的功能：</h6>
    <ul>
        <li>點一下上方週檢視的課程條可以查看課程資訊</li>
        <li>按住 Alt 再點的話，左邊的課程清單會自動捲動到你點的那個課程</li>
    </ul>
    <h6 style="font-size: 1em">許願清單：</h6>
    <ul>
        <li><strong>學年切換。</strong>不知道，好像沒什麼用</li>
    </ul>
    <p>
        現在的資料應該是 {formatSemester($selectedSemester)} ，詳細自己 F12 看請求
    </p>
</footer>
