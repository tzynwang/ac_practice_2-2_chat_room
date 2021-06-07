import { elementObject } from './modules/model.js'
import { establish, chatTo, show, pinFriend, sendChatMessage } from './modules/interaction.js'

establish.registerSW()
establish.initialSettings()

elementObject.friendList.addEventListener('click', event => {
  const friendId = event.target.dataset.id
  const chatId = event.target.dataset.chat
  const pinId = event.target.dataset.pin

  if (chatId) chatTo(chatId)
  if (friendId) show.friendModal(friendId)
  if (pinId) pinFriend(pinId)
})

elementObject.messageInputForm.addEventListener('keydown', sendChatMessage)

elementObject.userAvatarBtn.addEventListener('click', show.userModal)

elementObject.settingBtn.addEventListener('click', show.settingPanel)
