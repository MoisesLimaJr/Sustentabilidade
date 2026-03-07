const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['COOPERATIVE', 'COMPANY', 'LOGISTICS', 'SUPPORT', 'ADMIN'],
        default: 'COOPERATIVE'
    },
    phone: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    // Campos específicos para Empresa
    companyName: {
        type: String,
        default: ''
    },
    cnpj: {
        type: String,
        default: ''
    },
    // Campos específicos para Suporte
    department: {
        type: String,
        enum: ['general', 'technical', 'billing', ''],
        default: ''
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    // Status da conta
    active: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // cria automaticamente createdAt e updatedAt
});

// Hash da senha antes de salvar
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Atualizar updatedAt antes de salvar
UserSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Método para comparar senhas
UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Remover senha e campos sensíveis ao converter para JSON
UserSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

// Índices para busca otimizada
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ city: 1, state: 1 });

module.exports = mongoose.model('User', UserSchema);