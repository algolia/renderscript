import Altheia from 'altheia-async-data-validator';

export const alt = Altheia.instance();
alt.lang('protocol_not_allowed', () => 'Only HTTP protocol is allowed');

export function getDefaultParams(): Record<any, any> {
  return {
    url: alt
      .internet()
      .url()
      .custom('protocol_not_allowed', (val) => {
        return ['http:', 'https:'].includes(new URL(val).protocol);
      })
      .required(),
    ua: alt.string().required(),
    waitTime: alt.object().schema(
      alt({
        min: alt.number().cast().min(1000).max(19000),
        max: alt.number().cast().min(2000).max(20000),
      })
    ),
  };
}
