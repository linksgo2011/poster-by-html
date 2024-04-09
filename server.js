const fs = require("fs");
const ejs = require("ejs");
const puppeteer = require('puppeteer');
const express = require('express')
const ipfilter = require('express-ipfilter').IpFilter

const app = express()
const port = 8080

const ips = [
    '202.66.38.130',
    '113.200.150.121',
    '113.140.31.18',
    '112.46.64.218',
    '202.66.38.130',
    '114.247.59.210',
    '124.127.212.122',
    '202.66.38.130',
    '218.104.223.170',
    '182.150.56.97',
    '202.66.38.130',
    '220.249.123.170',
    '58.49.208.26',
    '202.66.38.130',
    '210.21.235.146',
    '61.144.206.250',
    '202.66.38.130',
    '220.248.92.74',
    '180.168.76.106',
    '202.66.34.49',
    '202.66.38.130',
    '183.91.151.226',
    '218.97.25.194',
    '118.123.145.27',
    // localhost
    '127.0.0.1',
    '192.168.1.2',
    '140.143.4.135'
]
if(process.env['ENV'] !== 'local'){
    console.info("非本地环境，开启 IP 过滤")
    app.use(ipfilter(ips, {mode: 'allow', log: false,detectIp:req => {
        return req.connection.remoteAddress.replace(/::ffff:/g, '')
    }}))
}

app.use((err, req, res, _next) => {
    res.status(400).send("bad request");
})

app.use(express.static('site'))
app.use("/templates", express.static('templates'))

const rootDir = process.cwd();

function getMetaJson(template) {
    const templateDir = `${rootDir}/templates/${template}/`;
    if (!fs.existsSync(templateDir)) {
        console.error("Template not found!");
        throw new Error("Template not found!");
    }
    return fs.readFileSync(`${templateDir}/meta.json`).toString();
}

function renderHTML(options) {
    const rootDir = process.cwd();
    const templateDir = `${rootDir}/templates/${options.template}/`;
    const templatePath = `/templates/${options.template}/`;
    if (!fs.existsSync(templateDir)) {
        console.error("Template not found!");
        return "Template not found!";
    }
    const templateFile = `${templateDir}index.html`;
    const templateString = fs.readFileSync(templateFile).toString();
    const data = {
        templatePath,
        sys: presetData(),
        ...JSON.parse(decodeURIComponent(options.parameters))
    }
    return ejs.render(templateString, data, {});
}

app.get('/preview', function (req, res) {
    res.send(renderHTML(req.query));
})

app.get('/download', async function (req, res) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setViewport({
        width: 800,
        height: 1150,
        deviceScaleFactor: 1,
        ...JSON.parse(getMetaJson(req.query.template))
    });

    const target = "http://140.143.4.135:8080/preview?parameters=" + req.query.parameters + '&template=' + req.query.template;
    await page.goto(target);
    let img = await page.screenshot();
    await browser.close();
    res.writeHead(200, {
        'Content-disposition': 'attachment; filename="poster.png"',
        'Content-Type': 'image/png',
        'Content-Length': img.length
    }).end(img);
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})

function presetData() {
    const now = new Date();
    const nowArray = now.toString().split(" ");
    return {
        en: {
            dayInWeek: nowArray[0],
            month: nowArray[1],
            dayInMonth: nowArray[2],
            year: nowArray[3],
            time: nowArray[4],
            monthNumber: now.getMonth() + 1
        },
        // turn to other
    }
}
