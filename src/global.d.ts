declare module 'ad-block' {
  // Type definitions for ad-block 4.1.7
  // Project: ad-block
  // Definitions by: Matthieu Dumont <https://www.github.com/Jerska>

  // Found in https://github.com/brave/ad-block/blob/master/ad_block_client_wrap.cc
  enum EFilterOptions {
    noFilterOption,
    script,
    image,
    stylesheet,
    object,
    xmlHttpRequest,
    objectSubrequest,
    subdocument,
    document,
    other,
    xbl,
    collapse,
    doNotTrack,
    elemHide,
    thirdParty,
    notThirdParty,
    ping,
    popup,
    redirect,
    csp,
    font,
    media,
    webrtc,
    genericblock,
    generichide,
    empty,
    websocket,
    important,
    explicitcancel,
    unknown,
  }

  interface IFilterOptions {
    [s: string]: EFilterOptions;
  }

  export const FilterOptions: IFilterOptions;

  export class AdBlockClient {
    parse(input: string): void;
    matches(input: string, option?: EFilterOptions, domain?: string): boolean;
  }
}
