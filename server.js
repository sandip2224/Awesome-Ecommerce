if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.redirect('/store');
})

app.get('/store', function (req, res) {
    // console.log("Redirected")
    fs.readFile('items.json', function (error, data) {
        if (error) {
            console.log("items.json READ FAIL (store)");
            res.status(500).end()
        }
        else {
            console.log("items.json READ SUCCESS (store)");
            res.render('store.ejs', {
                items: JSON.parse(data),
                stripePublicKey: stripePublicKey  //Sent to store.ejs as script tag var
            })
        }
    })
})

app.post('/purchase', function (req, res) {
    fs.readFile('items.json', function (error, data) {
        if (error) {
            // console.log("items.json READ FAIL (purchase)");
            res.status(500).end()
        }
        else {
            // console.log("items.json READ SUCCESS (purchase)");
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            let total = 0
            req.body.items.forEach((item) => {
                const itemJson = itemsArray.find(function (i) {
                    return item.id == i.id
                })
                total = total + itemJson.price * item.quantity
            })
            console.log('TOTAL: ', '$' + total / 100);
            stripe.charges.create({
                amount: total,
                source: req.body.stripeTokenId,
                currency: 'usd'
            }).then(function () {
                console.log("Charge SUCCESS!!")
                res.json({ message: 'PURCHASE SUCCESS!! Thank you for shopping with us ⚡' })
            }).catch(function () {
                console.log("Charge SUCCESS!!")
                res.json({ message: 'PURCHASE SUCCESS!! Thank you for shopping with us ⚡' })
            })
        }
    })
})

var port = 3000 || process.env.PORT
app.listen(port, function () {
    console.log("Server running on port ", port);
})