<script>
    export let name = "";
    export let nums = [];
    export let defaultNum = 0;

    const addNum = () => {
        nums = nums.concat(defaultNum);
    };
</script>

<div>
    <div class="input-group mb-3">
        <span class="input-group-text">{name}:</span>
        <input type="number" class="form-control" bind:value={defaultNum} />
        <button on:click={addNum} class="btn btn-dark">Adicionar {name}</button>
    </div>
    <ul class="list-group">
        {#each nums as num}
            <li class="list-group-item">{num}</li>
        {/each}
    </ul>
</div>

<style></style>
