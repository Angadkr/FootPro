const baseJoi = require('joi')
const sanitizeHtml = require('sanitize-html')

const extenstion = (joi)=>({
    type:'string',
    base:joi.string(),
    messages:{
        'string.escapeHTML':'{{#label}} must not include HTML'
    },
    rules:{
        escapeHTML: {
            validate(value,helpers) {
                const clean = sanitizeHtml(value,{
                    allowedTags:[],
                    allowedAttributes:{}
                })
                if (clean!=value) return helpers.error('string.escapeHTML',{value})
                return clean
            }
        }
    }
})
const Joi = baseJoi.extend(extenstion)


const CreaterSchema = Joi.object({
    username:Joi.string().required().escapeHTML(),
    password:Joi.string().required().escapeHTML(),
    email:Joi.string().required().escapeHTML(),
    age:Joi.number().required()
})

const PlayerSchema = Joi.object({
    name:Joi.string().required().escapeHTML(),
    club:Joi.string().required().escapeHTML(),
    country:Joi.string().required().escapeHTML(),
    age:Joi.string().required().escapeHTML(),
})

module.exports.CreaterSchema = CreaterSchema
module.exports.PlayerSchema = PlayerSchema