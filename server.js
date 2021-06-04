require('dotenv').config()

const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const express = require('express')
const app = express()
const fs = require('fs')
const bodyparser = require('body-parser')
const path = require('path')
const stripe = require('stripe')(stripeSecretKey)

// app.use(bodyparser.urlencoded({ extended: false }))
// app.use(bodyparser.json())

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
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
            console.log("items.json READ FAIL (purchase)");
            res.status(500).end()
        }
        else {
            console.log("items.json READ SUCCESS (purchase)");
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
            stripe.customers.create({
                email: req.body.stripeEmail,
                source: req.body.stripeTokenId,
                name: 'Customer',
                address: {
                    line1: 'Broadway Avenue',
                    postal_code: '43215',
                    city: 'Cleveland',
                    state: 'Ohio',
                    country: 'US'
                }
            }).then((customer) => {
                return stripe.charges.create({
                    amount: total,
                    description: 'Payment',
                    currency: 'USD',
                    customer: customer.id
                })
            }).then((charge) => {
                console.log("Charge SUCCESS!!")
                //res.redirect('/success')
                res.send("Success")
            }).catch((err) => {
                console.log("Charge FAILED!!")
                res.send(err)
            })
        }
    })
})

// app.get('/success', (req, res) => {
//     console.log("SUCCESS ROUTE");
//     res.sendFile(path.join(__dirname + '/thanks.html'));
// })

app.listen(process.env.PORT || 3000, function () {
    console.log("Server running");
})