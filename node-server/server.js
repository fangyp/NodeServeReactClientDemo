var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require("body-parser");
var excelPort = require('excel-export');

const isStringEmpty = (value) => {
    if (value === undefined) {
        return true;
    } else if (value === null) {
        return true;
    } else if (value === 'null') {
        return true;
    } else if (value === '') {
        return true;
    }
    return false;
}

app.get('/', function (req, res) {
    res.send('Sao dragon is running');
})

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 自定义跨域中间件
var allowCors = function (req, res, next) {
    console.log(req.headers.origin);
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
};
app.use(allowCors);

//  请求列表
app.post('/list', function (req, res) {
    let result = {
        success: false,
        result: [],
        msg: '',
    }
    fs.readFile(__dirname + "/" + "order.json", 'utf8', function (err, data) {
        if (err) {
            result['msg'] = '读取数据出现错误';
            res.send(JSON.stringify(result));
            return console.error(err);
        }
        let dataArray = [];
        if (!isStringEmpty(data.trim())) {
            dataArray = JSON.parse(data);
        }
        result['success'] = true;
        result['result'] = dataArray;
        result['msg'] = '读取数据列表成功';
        res.send(JSON.stringify(result));
    });
})


//  保存数据
app.post('/save', function (req, res) {

    let result = {
        success: false,
        result: [],
        msg: '',
    }
    fs.readFile(__dirname + "/" + "order.json", 'utf8', function (err, data) {
        if (err) {
            result['msg'] = '读取数据出现错误';
            res.send(JSON.stringify(result));
            return console.error(err);
        }
        let oldArray = [];
        if (!isStringEmpty(data.trim())) {
            oldArray = JSON.parse(data);
        }
        let newOrder = req.body;
        let newArray = [...oldArray, newOrder];
        fs.writeFile(__dirname + "/" + "order.json", JSON.stringify(newArray), function (err) {
            if (err) {
                result['msg'] = '写入数据出现错误';
                res.send(JSON.stringify(result));
                return console.error(err);
            }
            result['success'] = true;
            result['result'] = newArray;
            result['msg'] = '保存成功';
            res.send(JSON.stringify(result));
        })
    });
})

//  /del_user 页面响应
app.post('/delete', function (req, res) {

    let result = {
        success: false,
        result: [],
        msg: '',
    }
    fs.readFile(__dirname + "/" + "order.json", 'utf8', function (err, data) {
        if (err) {
            result['msg'] = '读取数据出现错误';
            res.send(JSON.stringify(result));
            return console.error(err);
        }
        let oldArray = [];
        if (!isStringEmpty(data.trim())) {
            oldArray = JSON.parse(data);
        }

        let key = req.body.key;
        let newArray = oldArray.filter((item, index) => {
            return item.key != key;
        })
        fs.writeFile(__dirname + "/" + "order.json", JSON.stringify(newArray), function (err) {
            if (err) {
                result['msg'] = '写入数据出现错误';
                res.send(JSON.stringify(result));
                return console.error(err);
            }
            result['success'] = true;
            result['result'] = newArray;
            result['msg'] = '删除成功';
            res.send(JSON.stringify(result));
        })
    });
})

app.post('/edit', function (req, res) {
    let result = {
        success: false,
        result: [],
        msg: '',
    }
    fs.readFile(__dirname + "/" + "order.json", 'utf8', function (err, data) {
        if (err) {
            result['msg'] = '读取数据出现错误';
            res.send(JSON.stringify(result));
            return console.error(err);
        }
        let dataArray = [];
        if (!isStringEmpty(data.trim())) {
            dataArray = JSON.parse(data);
        }
        let key = req.body.key;
        let status = req.body.status;
        let desc = req.body.desc;

        for (let index = 0; index < dataArray.length; index++) {
            const element = dataArray[index];
            if (element.key === key) {
                element["status"] = status;
                element["desc"] = desc;
                dataArray[index] = element;
                break;
            }
        }
        fs.writeFile(__dirname + "/" + "order.json", JSON.stringify(dataArray), function (err) {
            if (err) {
                result['msg'] = '写入数据出现错误';
                res.send(JSON.stringify(result));
                return console.error(err);
            }
            result['success'] = true;
            result['result'] = dataArray;
            result['msg'] = '修改成功';
            res.send(JSON.stringify(result));
        })
    });
})

//下载
app.post('/download', function (req, res) {
    let sourceArray = req.body || [];
    let conf = {};
    conf.name = "Sheet";//表格名

    conf.cols = [
        { caption: '日期', type: 'string', width: 40 },
        { caption: '宴会', type: 'string', width: 20 },
        { caption: '地点', type: 'string', width: 120 },
        { caption: '新人', type: 'string', width: 380 },
        { caption: '策划师', type: 'string', width: 50 },
        { caption: '价格', type: 'number', width: 30 },
        { caption: '要求', type: 'string', width: 80 },
        { caption: '状态', type: 'string', width: 60 },
        { caption: '备注', type: 'string', width: 200 },
    ];
    let dataArray = new Array();
    for (let i = 0; i < sourceArray.length; i++) {
        let rowArray = new Array();
        rowArray.push(sourceArray[i].date);
        rowArray.push(sourceArray[i].banquet);
        rowArray.push(sourceArray[i].address);
        rowArray.push(sourceArray[i].persons);
        rowArray.push(sourceArray[i].planner);
        rowArray.push(sourceArray[i].price);
        rowArray.push(sourceArray[i].level);
        rowArray.push(sourceArray[i].status === 'wait' ? '未开始' : sourceArray[i].status === 'ing' ? '进行中' : '已完成');
        rowArray.push(sourceArray[i].desc);
        dataArray.push(rowArray);
    }
    conf.rows = dataArray;//填充数据
    let result = excelPort.execute(conf);
    //最后3行express框架是这样写
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + "orders.xlsx");
    res.end(result, 'binary');

    var filePath = "./orders.xlsx";
    fs.writeFile(filePath, result, 'binary', function (err) {
        if (err) {
            console.log(err);
        }
        console.log("写入文件成功");
    });
})
// 对页面 abcd, abxcd, ab123cd, 等响应 GET 请求
app.get('/ab*cd', function (req, res) {
    console.log("/ab*cd GET 请求");
    res.send('正则匹配');
})

var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})