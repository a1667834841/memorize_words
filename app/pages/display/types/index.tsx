export interface originalWord {
  word: string;
  type: string;
  meaning: string;
}


export interface Association {
  part: string;
  partMeaning: string;
  word: string;
  type: string;
  meaning: string;
}

export interface WordAssociationData {
  originalWord: originalWord;
  associations: Association[];
  sentence: string;
  associate: boolean;
}

export const demoWordAssociationData: WordAssociationData = {
  originalWord: { word: "administrate", type: "v", meaning: "管理，经营，治理" },
  associations: [
    { part: 'ad', partMeaning: '广告', word: 'advertising', type: 'n', meaning: '广告' },
    { part: 'mini', partMeaning: '迷你', word: 'minimal', type: 'n', meaning: '最小' },
    { part: 'strate', partMeaning: '铺设的东西"或"扩展的表面', word: 'strategy', type: 'n', meaning: '战略' }
  ],
  sentence: '为了在日常生活中节省开支，小李采取了一个minimal lifestyle（极简生活方式），他甚至连看电视时都会跳过那些冗长的advertising（广告），因为他认为这些广告（advertising）会打断他享受节目的连续性。他制定了一个strategy（战略），那就是只关注那些能够提供实质性优惠的ad campaigns（广告活动），这样他既节省了时间，又避免了被不必要的信息干扰。',
  associate: true
};
