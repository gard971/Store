//config
var port = 3000;
var saltRounds = 10;
var emailUsername = "gardsoreng@gmail.com"
var emailPassword = "rhactdwiqjqwidos"

//dependencies
const app = require("express")()
const express = require("express")
const fs = require("fs")
const http = require("http").createServer(app).listen(port, () => {
    console.log(`server listening on port: ${port}`)
})
const io = require("socket.io")(http)
const path = require("path")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const formidable = require("formidable")
const paypal = require("paypal-rest-sdk")
var approvedKeys = []
paypal.configure({
    "mode": "sandbox",
    "client_id": "AeY4EnVK7UJ_2AxR66cY_zXDrOAHjZq0TLVqnkpFY6BkwrOvdMXF9sYl44MAPcREP7ccuY-8dUxTB9cn",
    "client_secret": "EAqK2uTsxgJVVWD3Gy1JWIWvoDqJVMHf9s9yIWsbsSM-CYNnxGWf19wiAKkoT2CNMmdA9Q4ptNS-iU5G"
})
app.post("/newProduct", (req, res) => {
    var formData = new formidable.IncomingForm()
    formData.parse(req, (err, fields, files) => {
        var extension = files.file.name.substr(files.file.name.lastIndexOf("."))
        var newPath = "public/images/productPics/" + fields.ProductName.split(" ").join("-") + extension
        if (fs.existsSync(newPath)) {
            res.write("Product name allready exists")
            res.end()

        } else {
            fs.rename(files.file.path, newPath, function (error) {
                if (error) {
                    throw error
                } else {
                    res.redirect("/admin.html?fileSent=true")
                    var newObject = {
                        "name": fields.ProductName.split(" ").join("-"),
                        "cost": +fields.cost,
                        "picFileLoc": newPath
                    }
                    var json = jsonRead("data/products.json")
                    json.push(newObject)
                    jsonWrite("data/products.json", json)
                }
            })
        }
    })
})
app.get("/success", (req, res) => {
    if (!req.query.product) {
        res.send("Missing product name. You have not been charged. Please try again")
        res.end()
    }
    else if(!req.query.email){
        alert("missing email. You have not been charged!. Please go back to the main page and redoo the whole process")
    }
     else {
        var paymentId
        var payerId
        var ammount
        var execute_payment_json
        var products = jsonRead("data/products.json")
        products.forEach(product => {
            if (product.name == req.query.product) {
                ammount = product.cost
            }
        })
        if (!ammount) {
            res.send("somthing went wrong when proccessing your request. You have not been charged")
            res.end()
        } else {
            payerId = req.query.PayerID;
            paymentId = req.query.paymentId;

            execute_payment_json = {
                "payer_id": payerId,
                "transactions": [{
                    "amount": {
                        "currency": "USD",
                        "total": ammount
                    }
                }]
            };
        }
        paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
            if (error) {
                res.send("somthing went wrong when proccessing your request. You have not been charged")
                res.end()
            } else {
                //stil needs to be upploded to an admin shipping page!!
                sendMail(req.query.email, `Order confirmation`, `Helo ${req.query.email}, we have recived your order of "${req.query.product}" and we herby confirm that the transaction was succsesfully completed. We will alert you again when we have shipped your item!`)
                res.redirect("TransactionCompleted.html")
                res.end()
            }
        })
    }
})
app.get('/cancel', (req, res) => res.send('Cancelled'));
app.use(express.static(path.join(__dirname, "public")))

io.on("connection", (socket) => {
    //venter på login requests og sjekker opp mot databasen 
    socket.on("login", (username, password, rememberMe) => {
        var json = jsonRead("data/users.json")
        if (json) {
            var found = false
            var needConfirm = false
            json.forEach(user => {
                if (user.username == username && bcrypt.compareSync(password, user.password) && user.confirmation) {
                    socket.emit("redir", "needConfirm.html")
                    needConfirm = true
                } else if (user.username == username && bcrypt.compareSync(password, user.password)) {
                    var newObject = {
                        "username": username,
                        "key": Math.floor(Math.random() * 100000000000000000000),
                        "admin": user.admin
                    }
                    approvedKeys.push(newObject)
                    found = true
                    socket.emit("passwordCorrect", newObject.username, newObject.key, rememberMe)
                }
            })
            if (!found && !needConfirm) {
                socket.emit("passwordWrong")
            }
        }
    })
    //venter på register requests og legger den nye kontoen inn i databasen hvis brukernavnet ikke allerede eksisterer
    socket.on("register", (username, nonHashPassword) => {
        hash(nonHashPassword).then(function (password) {
            if (password == false) {
                socket.emit("eror", "500 internal server error, server could not secure your password and therefore registration was cancelled. ERR:HASHERR")
                return false
            }
            var json = jsonRead("data/users.json")
            var found = false
            json.forEach(user => {
                if (user.username == username) {
                    socket.emit("usernameExists")
                    found = true
                }
            })
            if (!found) {
                var newObject = {
                    "username": username,
                    "password": password,
                    "admin": false,
                    "confirmation": {
                        "id": Math.random()
                    }
                }
                json.push(newObject)
                var status = jsonWrite("data/users.json", json)
                if (status == false) {
                    socket.emit("eror", "somthing went wrong when saving your username to the database. ERR:DATABASEFAIL");
                    return false
                } else {
                    socket.emit("userCreated")
                }
                sendMail(newObject.username, "Confirm Email", `hello ${newObject.username} you can confirm you email by pressing this link: http://31.45.72.232/confirm.html?id=${newObject.confirmation.id}`)
            }
        })
    })
    //sjekker om personer som er på innloggede sider faktisk har logget inn
    socket.on("check", (username, key, needsAdminPerms) => {
        var found = false
        approvedKeys.forEach(approvedKey => {
            if (approvedKey.username == username && approvedKey.key == key) {
                if (needsAdminPerms && approvedKey.admin) {
                    found = true
                } else if (!needsAdminPerms) {
                    found = true
                }
            }
        })
        if (!found) {
            socket.emit("notAllowed")
        } else {
            socket.emit("allowed")
        }
    })
    socket.on("confirm", (id) => {
        var found = false
        var json = jsonRead("data/users.json")
        json.forEach(user => {
            if (user.confirmation) {
                if (user.confirmation.id == id) {
                    found = true
                    delete user["confirmation"]
                    jsonWrite("data/users.json", json)
                }
            }
        })
        if (found) {
            socket.emit("userConfirmed")
        } else {
            socket.emit("eror", "500. The Supplied ID is either expired or never existed")
        }
    })
    socket.on("newEmail", (email) => {
        var users = jsonRead("data/users.json")
        var found = false
        users.forEach(user => {
            if (user.username == email && user.confirmation) {
                sendMail(email, "Confirm Email", `hello ${email} you can confirm you email by pressing this link: http://31.45.72.232/confirm.html?id=${user.confirmation.id}`)
                socket.emit("newMailSent")
                found = true
            }
        })
        if (!found) {
            socket.emit("eror", "Could not send email. Please double check the email you supplied")
        }
    })
    socket.on("requestProducts", () => {
        var json = jsonRead("data/products.json")
        socket.emit("products", JSON.stringify(json))
    })
    socket.on("requestSpesificProduct", (productName) => {
        var products = jsonRead("data/products.json")
        products.forEach(product => {
            if (product.name == productName) {
                socket.emit("spesificProduct", product)
            }
        })
    })
    socket.on("buyNow", (productName, email) => {
        var products = jsonRead("data/products.json")
        products.forEach(product => {
            if (product.name == productName) {
                const create_payment_json = {
                    "intent": "sale",
                    "payer": {
                        "payment_method": "paypal"
                    },
                    "redirect_urls": {
                        "return_url": `http://localhost:3000/success?product=${productName}&email=${email}`,
                        "cancel_url": "http://localhost:3000/cancel"
                    },
                    "transactions": [{
                        "item_list": {
                            "items": [{
                                "name": product.name,
                                "sku": "001",
                                "price": product.cost,
                                "currency": "USD",
                                "quantity": 1
                            }]
                        },
                        "amount": {
                            "currency": "USD",
                            "total": product.cost
                        },
                        "description": product.name
                    }]
                };
                paypal.payment.create(create_payment_json, function (error, payment) {
                    if (error) {
                        console.error(error)
                    } else {
                        for (var i = 0; i < payment.links.length; i++) {
                            if (payment.links[i].rel == "approval_url") {
                                socket.emit("redir", payment.links[i].href)
                            }
                        }
                    }
                })
            }
        })
    })
})

function jsonRead(file) {
    var data = fs.readFileSync(file, "utf-8")
    return JSON.parse(data)
}

function jsonWrite(file, data) {
    fs.writeFile(file, JSON.stringify(data), err => {
        if (err) {
            console.log(err);
            return false;
        } else {
            return true
        }
    })
}
async function hash(password) {
    try {
        var hashPassword = await bcrypt.hash(password, saltRounds)
        return hashPassword.toString()
    } catch (error) {
        console.log(error)
        return "error"
    }
}

function sendMail(reciver, emailSubject, message) {
    if (emailUsername) {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: emailUsername,
                pass: emailPassword
            }
        })
        let mailOptions = {
            from: emailUsername,
            to: reciver,
            subject: emailSubject,
            text: message + " This is an automated message. Please do not respond"
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                log(error)
                return console.log(error)
            }
            log(`sent mail to ${reciver}`)
        })
    }
}

function log(msg, isErr) { //main logging function
    var date = new Date()
    var month = date.getMonth() + 1
    var firstMinutes = date.getMinutes()
    var minutes
    if (firstMinutes < 10) {
        minutes = "0" + firstMinutes
    } else {
        minutes = firstMinutes
    }
    var fullMsg = "[" + date.getDate() + "." + month + "." + date.getFullYear() + " @ " + date.getHours() + ":" + minutes + "] " + msg
    if (!msg) {
        log("tried to log with no message provided")
        return;
    }
    if (fs.existsSync("data/logs/log.log") && useLogs || fs.existsSync("data/logs/log.log") && isErr) {
        fs.appendFileSync("data/logs/log.log", fullMsg + "\r\n")
    } else if (useLogs && fs.existsSync("data/logs") || isErr && fs.existsSync("data/logs")) {
        fs.writeFileSync("data/logs/log.log", "[" + date.getDate() + "." + month + "." + date.getFullYear() + " @ " + date.getHours() + ":" + minutes + `] Log file created, to disable logging check the index.js file: config section. logging is currently: ${useLogs} \r\n`)
        fs.appendFileSync("data/logs/log.log", fullMsg + "\r\n")
    } else if (useLogs || isErr) {
        fs.mkdirSync("data/logs")
        fs.writeFileSync("data/logs/log.log", "[" + date.getDate() + "." + month + "." + date.getFullYear() + " @ " + date.getHours() + ":" + minutes + `] Log file created, to disable logging check the index.js file: config section. logging is currently: ${useLogs} \r\n`)
        fs.appendFileSync("data/logs/log.log", fullMsg + "\r\n")
    }
}