<script>
    export let name = "";
    export let nums = [];
    export let defaultNum = 0;

    const addNum = () => {
        nums = nums.concat(defaultNum);
    };
</script>

<div>
    <label for="incomingNum">{name}</label>
    <input type="number" bind:value={defaultNum} id="incomingNum" />
    <ul>
        {#each nums as num}
            <li>{num}</li>
        {/each}
    </ul>
    <button on:click={addNum}>Adicionar {name}</button>
</div>

<style></style>
