const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  department: {
    type: String,
    enum: ['support', 'technical', 'billing', 'general'],
    default: 'support'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  maxConcurrentChats: {
    type: Number,
    default: 5
  },
  currentChats: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    room: String,
    startedAt: { type: Date, default: Date.now }
  }],
  chatHistory: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    room: String,
    startedAt: Date,
    endedAt: Date
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  responseTime: {
    average: { type: Number, default: 0 }, // em segundos
    count: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Verificar se pode aceitar novo chat
supportSchema.methods.canAcceptChat = function() {
  return this.isAvailable && this.currentChats.length < this.maxConcurrentChats;
};

// Adicionar chat atual
supportSchema.methods.addChat = function(userId, room) {
  if (!this.canAcceptChat()) {
    throw new Error('Suporte não disponível para novo chat');
  }
  
  this.currentChats.push({
    user: userId,
    room,
    startedAt: new Date()
  });
  
  return this.save();
};

// Finalizar chat
supportSchema.methods.endChat = function(userId) {
  const chatIndex = this.currentChats.findIndex(c => c.user.toString() === userId.toString());
  
  if (chatIndex > -1) {
    const chat = this.currentChats[chatIndex];
    this.chatHistory.push({
      user: chat.user,
      room: chat.room,
      startedAt: chat.startedAt,
      endedAt: new Date()
    });
    this.currentChats.splice(chatIndex, 1);
  }
  
  return this.save();
};

// Buscar suporte disponível
supportSchema.statics.findAvailableSupport = function(department = null) {
  const query = { isAvailable: true };
  if (department) {
    query.department = department;
  }
  
  return this.find(query)
    .populate('user', 'name email')
    .sort({ 'currentChats.length': 1 });
};

const Support = mongoose.model('Support', supportSchema);
module.exports = Support;