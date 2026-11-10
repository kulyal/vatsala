import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'prompt-master',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

const USAGE = {
  input_tokens: 1,
  output_tokens: 1,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
}

test('one press rewrites the draft in the box, and Undo puts it back', async ($, on) => {
  let box = 'fix login bug'
  let asked = ''
  on('prompt.read', () => ({ value: { text: box, cursor: box.length } }))
  on('prompt.fill', (_, e) => {
    box = e.text

    return { isFilled: true }
  })
  on('model.complete', (_, e) => {
    asked = e.prompt

    return {
      value: { isAnswered: true, text: 'Fix the login bug: ...', usage: USAGE },
    }
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    box = 'fix login bug'
    const ui = await $.ui.mount({ ...BAND, surface })

    expect(await ui.find({ key: 'undo' })).toBeUndefined()
    await ui.press({ key: 'run' })
    expect(asked).toContain('fix login bug')
    expect(box).toBe('Fix the login bug: ...')

    await ui.press({ key: 'undo' })
    expect(box).toBe('fix login bug')
    await ui.unmount()
  }
})

test('an empty box calls no model', async ($, on) => {
  let calls = 0
  on('prompt.read', () => ({ value: { text: '  ', cursor: 0 } }))
  on('model.complete', () => {
    calls += 1

    return { value: { isAnswered: true, text: 'x', usage: USAGE } }
  })
  on('ui.toast', () => ({ value: undefined }))

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'run' })
  expect(calls).toBe(0)
  await ui.unmount()
})

test('a failed model call leaves the draft alone', async ($, on) => {
  let box = 'rough'
  on('prompt.read', () => ({ value: { text: box, cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    box = e.text

    return { isFilled: true }
  })
  on('model.complete', () => ({
    value: {
      isAnswered: false,
      reason: 'api-error',
      status: 529,
      error: 'overloaded',
      usage: USAGE,
    },
  }))
  on('ui.toast', () => ({ value: undefined }))

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'run' })
  expect(box).toBe('rough')
  await ui.unmount()
})

test('a box that cannot be written offers the rewrite in the band', async ($, on) => {
  on('prompt.read', () => ({ value: { text: 'rough', cursor: 0 } }))
  on('prompt.fill', () => ({ isFilled: false, refusal: 'no_composer' }))
  on('model.complete', () => ({
    value: { isAnswered: true, text: 'Better prompt.', usage: USAGE },
  }))

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'run' })
  expect((await ui.find({ type: 'Text', text: /Better/ }))?.text).toBe(
    'Better prompt.',
  )
  expect(await ui.find({ key: 'send' })).toBeDefined()
  await ui.press({ key: 'dismiss' })
  expect(await ui.find({ key: 'run' })).toBeDefined()
  await ui.unmount()
})

const PANE = {
  plugin: 'prompt-master',
  component: 'Pane',
  requestId: 'prompt-master',
  props: {
    title: 'Prompt Master',
    isFocused: false,
    bodyColumns: 40,
    placement: 'inline',
    scroll: { offset: 0, bodyRows: 12 },
    view: {},
  },
} as const

test('on a phone the panel takes a rough prompt and offers the rewrite to send', async ($, on) => {
  const sent: string[] = []
  // A phone's own composer: the mod reads nothing from it and writes nothing.
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', () => ({ isFilled: false, refusal: 'no_composer' }))
  on('prompt.submit', (_, e) => {
    sent.push(e.text)

    return { text: e.text }
  })
  on('model.complete', () => ({
    value: { isAnswered: true, text: 'Better prompt.', usage: USAGE },
  }))

  const ui = await $.ui.mount({ ...PANE, surface: 'mobile' })

  expect(await ui.find({ key: 'run' })).toBeDefined()
  await ui.input({ key: 'rough', text: 'fix login bug' })
  expect((await ui.find({ type: 'Text', text: /Better/ }))?.text).toBe(
    'Better prompt.',
  )
  await ui.press({ key: 'send' })
  expect(sent).toEqual(['Better prompt.'])
  expect(await ui.find({ key: 'send' })).toBeUndefined()
  await ui.unmount()
})

test('a phone joining the session opens the panel', async ($, on) => {
  const opened: string[] = []
  on('ui.open', (_, e) => {
    opened.push(e.id)

    return { value: { isPlaced: true } }
  })
  on('session.attach', (_, e) => ({ clientId: e.clientId }))

  await $.session.attach({ surface: 'mobile', clientId: 'mobile:default' })
  expect(opened).toEqual(['prompt-master'])
})
