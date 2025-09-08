<script setup lang="ts">

</script>

<template>
	<div class="content">
		<img src="/static/images/palettes/blue.png" />
		<div v-for="i in 100" :key="i" class="item">Item {{ i }}</div>
		<img src="/static/images/palettes/pink.png" />
	</div>
</template>

<style scoped lang="scss">
	img {
		width: 120%;
	}
</style>
