<script>
    export let name = "";
    export let nums = [];
    export let defaultNum = 0;

    const addNum = () => {
        nums = nums.concat(defaultNum);
    };

    const removeNum =
        (removeIndex = -1) =>
        () => {
            nums = nums.filter((_, index) => index !== removeIndex);
        };
</script>

<div>
    <div class="input-group mb-3">
        <span class="input-group-text">{name}:</span>
        <input type="number" class="form-control" bind:value={defaultNum} />
        <button on:click={addNum} class="btn btn-dark">Adicionar {name}</button>
    </div>
    <div class="list-group">
        {#each nums as num, index}
            <button on:click={removeNum(index)} class="list-group-item list-group-item-action">{num}</button>
        {/each}
    </div>
</div>

<style></style>
