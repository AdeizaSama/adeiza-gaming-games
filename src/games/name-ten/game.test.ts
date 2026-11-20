import { describe, expect, it } from 'vitest'
import { NameTenConfig } from './config'
import nameTen from './index'
import { machine } from './machine'
import { HandoffView } from './views/HandoffView'

describe('Name Ten game definition', () => {
  it('is a valid game with the Back to School pack, its own settings, and its own handoff', () => {
    expect(nameTen.meta.id).toBe('name-ten')
    expect(nameTen.content.packs.map((pack) => pack.id)).toContain('back-to-school')
    expect(nameTen.machine).toBe(machine)
    expect(nameTen.config.schema).toBe(NameTenConfig)
    expect(nameTen.views.handoff).toBe(HandoffView)
    expect(nameTen.rules).toContain('## A turn')
  })
})
