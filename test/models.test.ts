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
          US: ['US-AK']
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
    it('should be true if no subregion specified', () => {
      expect(modelSupports(spec(), ['GB', undefined])).toBe(true)
    })
    it('should be true if _self subregion specified', () => {
      expect(modelSupports(spec(), ['GB', '_self'])).toBe(true)
    })
    it('should be true if no subregion specified', () => {
      expect(modelSupports(spec(), ['US', undefined])).toBe(true)
    })
    it('should be true if _self subregion specified', () => {
      expect(modelSupports(spec(), ['US', '_self'])).toBe(true)
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
