<template>
  <tr v-for="i in clockings" :key="i.day">

    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
      {{ getDayOfWeek(i.day) }}, {{ yiddish_date(i.day) }} <br>
      {{ i.day }}
    </td>

    <!-- Morning In -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
      <span v-for="c in i.clocking" :key="c.id" v-html="c.session == 1 ? sec_to_time(c.in) + '<br>' : ''"></span>
    </td>

    <!-- Morning Out -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
      <span v-for="c in i.clocking" :key="c.id" v-html="c.session == 1 ? sec_to_time(c.out) + '<br>' : ''"></span>
    </td>

    <!-- Morning Retzifus -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
      <span v-for="c in i.clocking" :key="c.id">
        <span v-if="c.session == 1">{{ c.retzifus == 1 ? '✓' : '✕' }}<br></span>
      </span>
    </td>

    <!-- Morning Edit Button -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
      <span v-for="c in i.clocking" :key="c.id">
        <span v-if="c.session == 1">
          <button @click="edit_clicked(c)" v-html="button_text(c)"></button><br>
        </span>
      </span>
    </td>

    <!-- Morning Percent -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700 border-r-4" v-html="percent(i.clocking, 1)"></td>

    <!-- Afternoon In -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
      <span v-for="c in i.clocking" :key="c.id" v-html="c.session == 2 ? sec_to_time(c.in) + '<br>' : ''"></span>
    </td>

    <!-- Afternoon Out -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
      <span v-for="c in i.clocking" :key="c.id" v-html="c.session == 2 ? sec_to_time(c.out) + '<br>' : ''"></span>
    </td>

    <!-- Afternoon Retzifus -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
      <span v-for="c in i.clocking" :key="c.id">
        <span v-if="c.session == 2">{{ c.retzifus == 1 ? '✓' : '✕' }}<br></span>
      </span>
    </td>

    <!-- Afternoon Edit Button -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700">
      <span v-for="c in i.clocking" :key="c.id">
        <span v-if="c.session == 2">
          <button @click="edit_clicked(c)" v-html="button_text(c)"></button><br>
        </span>
      </span>
    </td>

    <!-- Afternoon Percent -->
    <td class="whitespace-nowrap px-4 py-2 text-gray-700" v-html="percent(i.clocking, 2)"></td>

  </tr>
</template>

<script setup>
import { sec_to_time } from '~/utils/sec_to_time'
import { G2H, getDayOfWeek } from '~/utils/Gregorian_to_Hebrew'
import { percent } from '~/utils/percent'

const props = defineProps({
  clockings: { type: Array, default: () => [] },
  pending_requests: { type: Object, default: () => ({}) },
  last_editable_date: { type: String, default: '' }
})

const emit = defineEmits(['edit_clicked'])

const model = reactive({
  day: '',
  user_id: '',
  id: '',
  in: '',
  out: '',
  session: '',
  retzifus: '',
  session_id: ''
})

const yiddish_date = (date) => {
  const [y, m, d] = date.split('-')
  return G2H(y, m, d)
}

const button_text = (current) => {
  const state = is_editable(current.id, current.day, current.session)

  if (state === 'p') return '<img style="height:20px" src="/img/icon/pending.svg">'
  if (state === 'l') return '<img style="height:20px" src="/img/icon/lock.svg">'
  return '<img style="height:20px" src="/img/icon/edit.svg">'
}

const edit_clicked = (current) => {
  const state = is_editable(current.id, current.day, current.session)

  if (state === 'p') return msg('info', 'This entry is Pending')
  if (state === 'l') return msg('info', 'This entry is Locked')

  request_edit(current)
}

const request_edit = (current) => {
  model.id = current.id
  model.in = sec_to_time(current.in, false)
  model.out = sec_to_time(current.out, false)
  model.retzifus = current.retzifus == 1
  model.session = current.session
  model.notes = current.notes
  model.session_id = current.session_id
  model.day = current.day
  model.user_id = current.user_id

  emit('edit_clicked', model)
}

const is_editable = (id, date, session) => {
  const last = new Date(props.last_editable_date)
  const day = new Date(date)

  if (day < last) return 'l'

  for (const key in props.pending_requests) {
    const req = props.pending_requests[key]

    if (id === null) {
      if (req.day === date && req.session === session) return 'p'
    } else {
      if (req.clocking_id === id) return 'p'
    }
  }

  return 'e'
}
</script>