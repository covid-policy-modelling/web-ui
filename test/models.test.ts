import {modelSupports, SupportedParameter} from '../lib/models'

describe('models', () => {
  describe('modelSupports', () => {
    const spec = () => {
      return {
        name: '',
        origin: '',
        imageURL: '',
        description: '',
        supportedParameters: [SupportedParameter.R0],
        supportedRegions: {
          GB: [],
          US: ['US-AK'],
          AU: ['AU', 'AU-ACT']
        },
        enabled: true
      }
    }

    it('should be true if parameter listed', () => {
      expect(modelSupports(spec(), SupportedParameter.R0)).toBe(true)
    })
    it('should be false if parameter not listed', () => {
      expect(modelSupports(spec(), SupportedParameter.ContactReduction)).toBe(
        false
      )
    })
    it('should be true if no subregion specified and no subregions listed', () => {
      expect(modelSupports(spec(), ['GB', undefined])).toBe(true)
    })
    it('should be true if _self subregion specified and no subregions listed', () => {
      expect(modelSupports(spec(), ['GB', '_self'])).toBe(true)
    })
    it('should be false if no subregion specified', () => {
      expect(modelSupports(spec(), ['US', undefined])).toBe(false)
    })
    it('should be false if _self subregion specified', () => {
      expect(modelSupports(spec(), ['US', '_self'])).toBe(false)
    })
    it('should be true if no subregion specified and parent explicitly listed', () => {
      expect(modelSupports(spec(), ['AU', undefined])).toBe(true)
    })
    it('should be true if _self subregion specified and parent explicitly listed', () => {
      expect(modelSupports(spec(), ['AU', '_self'])).toBe(true)
    })
    it('should be true if subregion listed', () => {
      expect(modelSupports(spec(), ['US', 'US-AK'])).toBe(true)
    })
    it('should be false if region not listed', () => {
      expect(modelSupports(spec(), ['CA', null])).toBe(false)
    })
    it('should be false if subregion not listed', () => {
      expect(modelSupports(spec(), ['US', 'US-AL'])).toBe(false)
    })
    it('should be true if no regions listed', () => {
      const s = spec()
      delete s.supportedRegions
      expect(modelSupports(s, ['CA', null])).toBe(true)
    })
  })
})
