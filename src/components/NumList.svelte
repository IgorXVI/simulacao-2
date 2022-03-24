<script>
    export let name = "";
    export let nums = [];
    export let defaultNum = 0;

    const addNum = () => {
        nums = nums.concat(defaultNum);
    };
</script>

<div class="form-row">
    <div class="form-group col-md-6">
        <label for="incomingNum">{name}</label>
    </div>
    <div class="form-group col-md-6">
        <input type="number" bind:value={defaultNum} id="incomingNum" />
    </div>
    <div class="form-group col-md-6">
        <button on:click={addNum}>Adicionar {name}</button>
    </div>
</div>

<ul class="list-group">
    {#each nums as num}
        <li class="list-group-item">{num}</li>
    {/each}
</ul>

<style></style>
