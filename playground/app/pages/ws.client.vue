<template>
  <div>
    <NuxtLink to="/">
      Home
    </NuxtLink>
    <div :style="{ marginTop: '1rem' }">
      <div>
        <div>
          Channels:
          <div class="state-selector">
            <div v-for="state in items" :key="state">
              <input
                :id="state"
                v-model="channels"
                type="checkbox"
                :value="state"
              >
              <label :for="state">{{ state.charAt(0).toUpperCase() + state.slice(1) }}</label>
            </div>
          </div>
          <button
            v-if="status === 'CLOSED'"
            @click.prevent="open()"
          >
            Reconnect
          </button>
          <button @click="triggerNotification()">
            Trigger notification
          </button>
        </div>
        <div>
          Send chat message:
          <input v-model="message" :disabled="!channels.includes('chat')">
          <button
            :disabled="!channels.includes('chat')"
            @click.prevent="sendData"
          >
            Send
          </button>
        </div>
        <div>
          <p>Status: {{ status }}</p>
          <p>Updates</p>
          <pre>
            <code v-if="states['chat']">
              {{ states['chat'] }}
            </code>
            <br>
            <code v-if="states['notifications']">
              {{ states['notifications'] }}
            </code>
            <br>
            <code v-if="session">
              {{ session }}
            </code>
            <br>
            <code v-if="_internal">
              {{ _internal }}
            </code>
            <br>
          </pre>
          <ul>
            <li v-for="(item, index) of history" :key="index">
              <code>{{ item }}</code><br>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const items = ['notifications', 'chat']
const channels = ref<string[]>(['notifications'])

const { states, data, status, send, open } = useWS<{
  notifications: {
    message: string
  }
  chat: {
    [key: string]: string
  }
  session: {
    users: number
  }
  _internal: {
    connectionId: string
    channels: string[]
    message?: string
  }
}>(channels)

const { _internal, session } = states

const history = ref<string[]>([])
watch(data, (newValue) => {
  history.value.push(`server: ${newValue}`)
})

const message = ref<string>('')
function sendData() {
  if (
    !message.value
    || !_internal.value?.connectionId
    || status.value !== 'OPEN'
    || !channels.value.includes('chat')
  ) return

  states['chat'].value = {
    ...states['chat'].value,
    [_internal.value.connectionId]: message.value,
  }

  history.value.push(`client: ${JSON.stringify({ channel: 'chat', data: states['chat'].value })}`)
  send('chat', states['chat'].value)
  message.value = ''
}

function triggerNotification() {
  return $fetch('/api/ws/trigger')
}
</script>
