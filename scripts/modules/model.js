export const elementObject = {
  friendList: document.querySelector('#friendList'),
  friendModal: document.querySelector('#friendModal'),
  startChatHint: document.querySelector('#startChatHint'),
  friendNameChatTo: document.querySelector('#friendNameDisplay'),
  messageDisplay: document.querySelector('#messageDisplay'),
  messageInputContainer: document.querySelector('#messageInputContainer'),
  messageInputForm: document.querySelector('#messageInputForm'),
  messageInput: document.querySelector('#messageInput'),
  messageInputFormResetBtn: document.querySelector('#messageInputFormResetBtn'),
  userAvatarBtn: document.querySelector('#userAvatar>i'),
  settingBtn: document.querySelector('#personalSettings'),
  personalSettingsPanel: document.querySelector('#personalSettingsPanel'),
  ceremonyMessageContainer: document.querySelector('#ceremonyMessage')
}

export const config = {
  friendListApi: 'https://lighthouse-user-api.herokuapp.com/api/v1/users',
  picsumApi: 'https://picsum.photos/v2/list',
  replyMessageApi: 'https://baconipsum.com/api/?type=meat-and-filler&sentences=',
  emojiApi: 'https://emoji-api.com/categories/smileys-emotion?access_key=64e32f2634c879f7b346c2c6492f80d853ca3090',
  minOnlineNumber: 5,
  maxOnlineNumber: 10,
  friendReplyNumber: 3
}

export const templateData = {
  nowChatWith: undefined
}
