<script setup lang="ts">
const availableStates = ['pizza', 'burger']
const selectedState = ref<string[]>([])

const availablePizzas = ['capricciosa', 'margerita']
const availableBurgers = ['cheese', 'veggie']

const states = useMultiState(selectedState)
</script>

<template>
  <div class="container">
    <h2>Food Order System</h2>

    <div class="state-selector">
      <div v-for="state in availableStates" :key="state" class="checkbox-wrapper">
        <input
          :id="state"
          v-model="selectedState"
          type="checkbox"
          :value="state"
        >
        <label :for="state">{{ state.charAt(0).toUpperCase() + state.slice(1) }}</label>
      </div>
    </div>

    <div class="food-sections">
      <div
        v-if="selectedState.includes('pizza')"
        :class="['food-section', { active: states['pizza'] }]"
      >
        <h3>Pizza Selection</h3>
        <select v-if="states['pizza']" v-model="states['pizza'].value" class="food-select">
          <option value="" disabled selected>
            Select a pizza
          </option>
          <option v-for="pizza in availablePizzas" :key="pizza" :value="pizza">
            {{ pizza.charAt(0).toUpperCase() + pizza.slice(1) }}
          </option>
        </select>
        <Pizza v-if="states['pizza']" />
      </div>

      <div
        v-if="selectedState.includes('burger')"
        :class="['food-section', { active: states['burger'] }]"
      >
        <h3>Burger Selection</h3>
        <select v-if="states['burger']" v-model="states['burger'].value" class="food-select">
          <option value="" disabled selected>
            Select a burger
          </option>
          <option v-for="burger in availableBurgers" :key="burger" :value="burger">
            {{ burger.charAt(0).toUpperCase() + burger.slice(1) }}
          </option>
        </select>
        <Burger v-if="states['burger']" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.state-selector {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-wrapper label {
  cursor: pointer;
  font-size: 1.1em;
}

.food-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.food-section {
  padding: 20px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  transition: all 0.3s ease;
}

.food-section.active {
  border-color: #4CAF50;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.food-section h3 {
  margin-top: 0;
  color: #2c3e50;
  margin-bottom: 15px;
}

.food-select {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ced4da;
  margin-bottom: 15px;
  font-size: 1em;
}

.food-select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76,175,80,0.2);
}
</style>
