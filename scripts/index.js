import * as model from './modules/model.js'
import * as interaction from './modules/interaction.js'

interaction.establishChatLogInLocalStorage()
interaction.establishConfigInLocalStorage()
interaction.loadFriendList()
interaction.checkIfCeremonyDate()

model.elementObject.friendList.addEventListener('click', event => {
  const friendId = event.target.dataset.id
  const chatId = event.target.dataset.chat
  const pinId = event.target.dataset.pin
  if (chatId) interaction.chatTo(chatId)
  if (friendId) interaction.displayPersonalInfoModal(friendId)
  if (pinId) interaction.pinFriend(pinId)
})

model.elementObject.messageInputForm.addEventListener('keydown', interaction.sendChatMessage)

model.elementObject.userAvatarBtn.addEventListener('click', interaction.setUserAvatarModal)

model.elementObject.settingBtn.addEventListener('click', interaction.setSettingModal)
