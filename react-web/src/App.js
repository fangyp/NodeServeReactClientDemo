import React from 'react';
import './App.css';
import { Input, Modal, Form, Button, Radio } from 'antd';
import { message, Table, Divider, Tag, Popconfirm } from 'antd';
const { TextArea } = Input;

const domainUrl = 'http://18.163.50.82:8081/';

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

const genKey = () => {
  return Number(Math.random().toString().substr(3, 5) + Date.now()).toString(36);
}

const defaultRow = {
  key: genKey(),//唯一id
  status: 'wait', //默认状态
  desc: '' //默认备注
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      editRow: { ...defaultRow },
      form: {
        inputText: '',
      },
      columns: [
        {
          title: '日期',
          dataIndex: 'date',
          render: text => text,
          defaultSortOrder: 'ascend',
          sorter: function (a, b) { return Date.parse(a.date) - Date.parse(b.date) },
        },
        {
          title: '宴会',
          dataIndex: 'banquet',
        },
        {
          title: '地点',
          dataIndex: 'address',
        },
        {
          title: '新人',
          dataIndex: 'persons',
        },
        {
          title: '策划师',
          dataIndex: 'planner',
        },
        {
          title: '价格',
          dataIndex: 'price',
          defaultSortOrder: 'ascend',
          sorter: function (a, b) { return a.price - b.price },
        },
        {
          title: "水平",
          dataIndex: "level",
        },
        {
          title: '状态',
          dataIndex: 'status',
          filters: [{ text: '未开始', value: 'wait' }, { text: '进行中', value: 'ing' }, { text: '已完成', value: 'done' }],
          onFilter: (value, record) => record.status.indexOf(value) === 0,
          render: status => {
            let color = 'green';
            let msg = '';
            if (status === 'wait') {
              color = 'orange';
              msg = '未开始';
            } else if (status === 'ing') {
              color = 'green';
              msg = '进行中';
            } else if (status === 'done') {
              color = 'lightgray';
              msg = '已完成';
            }
            return (
              <Tag color={color} key={status}>
                {msg}
              </Tag>
            );
          }
        },
        {
          title: "备注",
          dataIndex: "desc",
        },
        {
          title: '操作',
          key: 'action',
          render: (text, record) =>
            <span>
              <a onClick={() => this.showModal(record)}>修改</a>
              <Divider type="vertical" />
              <Popconfirm title="确定删除?" onConfirm={() => this.deleteRow(record)}>
                <a>删除</a>
              </Popconfirm>
            </span>
        },
      ],
      data: []
    }
  }

  componentDidMount() {

    console.log('start app running');
    let url = `${domainUrl}list`
    fetch(url, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(response => response.json())
      .then(response => {
        console.log('Success:', response)

        const { result = [], msg = '' } = response;
        this.setState({
          data: result
        })
        message.success(msg);
      })
      .catch(error => {
        message.error('网络连接失败', error);
      });
  }

  /**
   * 解析订单字符串
   * @param {*} e 
   */
  onSubmit(e) {
    e.preventDefault();

    let sourceString = this.state.form.inputText.trim();

    if (isStringEmpty(sourceString)) {
      message.error('请输入订单信息');
      return;
    }

    let dataMap = { ...defaultRow, key: genKey() };

    let persionArray = sourceString.split("新人");

    for (let index = 0; index < persionArray.length; index++) {
      const element = persionArray[index];
      if (element.includes('策划师')) {
        let plannerArray = sourceString.split("策划师");

        for (let index = 0; index < plannerArray.length; index++) {
          const element = plannerArray[index];
          if (element.includes('新人') || element.startsWith('新人')) {
            let personArrayTemp = element.split('新人');
            for (const item of personArrayTemp) {
              if (item.startsWith('：') || item.startsWith(':')) {

                let firstSourceArray = item.replace('：', '').replace(':', '').split(" ");
                let firstArray = [];

                for (let index = 0; index < firstSourceArray.length; index++) {
                  const element = firstSourceArray[index];

                  if (!isStringEmpty(element)) {
                    firstArray.push(element.trim());
                  }
                }
                dataMap['persons'] = firstArray.join(" ");
              }
            }
          } else {
            if (element.startsWith('：') || element.startsWith(':')) {
              let secondSourceArray = element.replace('：', '').replace(':', '').split(" ");
              let secondArray = [];

              for (let index = 0; index < secondSourceArray.length; index++) {
                const element = secondSourceArray[index];

                if (!isStringEmpty(element)) {
                  secondArray.push(element.trim());
                }
              }
              let address = '';
              for (let index = 0; index < secondArray.length; index++) {
                const element = secondArray[index];
                if (secondArray.length >= 1 && index === 0) {
                  dataMap['planner'] = element;
                } else if ((secondArray.length >= 2 && index === 1) || (secondArray.length >= 3 && index === 2)) {
                  address += element
                  dataMap['address'] = address;
                } else if (secondArray.length >= 4 && index === 3) {
                  let price = element.replace(/[^0-9]/ig, "");
                  dataMap['price'] = price;
                  let levelArray = element.split(price + '');
                  if (levelArray.length === 2) {
                    dataMap['level'] = levelArray[1];
                  }
                }
              }
            }
          }
        }

      } else {
        let firstSourceArray = element.split(" ");
        let firstArray = [];

        for (let index = 0; index < firstSourceArray.length; index++) {
          const element = firstSourceArray[index];

          if (!isStringEmpty(element)) {
            firstArray.push(element.trim());
          }
        }
        for (const element of firstArray) {
          //处理日期
          if (isNaN(element) && !isNaN(Date.parse(element))) {
            dataMap['date'] = element;
          }
          //宴会
          if (element.includes('宴')) {
            dataMap['banquet'] = element;
          }
        }
      }
    }
    let url = `${domainUrl}save`
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(dataMap),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(response => response.json())
      .then(response => {
        this.setState({
          form: {
            inputText: '',
          },
        })
        const { result = [], msg = '' } = response;
        this.setState({
          data: result
        })
        message.success(msg);
      })
      .catch(error => {
        message.error('网络连接失败', error);
      });

  }
  /**
   * 输入订单字符串
   * @param {*} e 
   */
  onChange(e) {
    const { value } = e.target;
    this.state.form.inputText = value;
    this.forceUpdate();
  }
  /**
   * 删除一行
   * @param {*} row 
   */
  deleteRow(row) {

    let url = `${domainUrl}delete`
    fetch(url, {
      method: 'POST',
      body: JSON.stringify({ "key": row.key }),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(response => response.json())
      .then(response => {
        console.log('Success:', response)

        const { result = [], msg = '' } = response;
        this.setState({
          data: result
        })
        message.success(msg);
      })
      .catch(error => {
        message.error('网络连接失败', error);
      });
  }
  /**
   * 导出excel
   */
  exportExcel = () => {
    console.log('导出excel');
    let url = `${domainUrl}download`
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(this.state.data),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(res => res.blob().then(blob => {
      var filename = `${'Orders'}.xlsx`
      if (window.navigator.msSaveOrOpenBlob) {
        navigator.msSaveBlob(blob, filename);  //兼容ie10
      } else {
        var a = document.createElement('a');
        document.body.appendChild(a) //兼容火狐，将a标签添加到body当中
        var url = window.URL.createObjectURL(blob);   // 获取 blob 本地文件连接 (blob 为纯二进制对象，不能够直接保存到磁盘上)
        a.href = url;
        a.download = filename;
        a.target = '_blank'  // a标签增加target属性
        a.click();
        a.remove()  //移除a标签
        window.URL.revokeObjectURL(url);
      }
    }))
  }

  /**
   * 编辑一行
   */
  showModal = (row) => {
    this.setState({
      visible: true,
      editRow: { ...row },
    });
  };

  handleOk = () => {
    this.setState({
      visible: false,
    });
    const { editRow } = this.state;
    let url = `${domainUrl}edit`
    fetch(url, {
      method: 'POST',
      body: JSON.stringify({ "key": editRow.key, "status": editRow.status, "desc": editRow.desc }),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(response => response.json())
      .then(response => {
        console.log('Success:', response)

        const { result = [], msg = '' } = response;
        this.setState({
          data: result
        })
        message.success(msg);
      })
      .catch(error => {
        message.error('网络连接失败', error);
      });

  };
  handleCancel = () => {
    this.setState({
      visible: false,
      editRow: { ...defaultRow },
    });
  };

  onDescChange(e) {
    const { value } = e.target;
    this.state.editRow.desc = value;
    this.forceUpdate();
  }

  /**
   * 改变状态
   */
  onRadioChange = e => {
    const { editRow } = this.state;
    editRow.status = e.target.value;
    console.log(editRow);
    this.setState({
      editRow: editRow,
    });
  };

  render(h) {
    return (
      <div className="Container">
        <Form model={this.state.form} className="inputBox" >
          <Form.Item className="FormItem">
            <TextArea className="InputText" placeholder="格式: 2020.1.30  午宴  新人: 徐旭斌 诸梦姣  18626071337 15052214282  策划师: 费红玉   红星店  同庆CD厅  请安排一个1900双机摄影  收到请回复" rows={4} value={this.state.form.inputText} onChange={this.onChange.bind(this)} />
          </Form.Item>
          <Form.Item className="Buttons">
            <Button className="ButtonBox" type="primary" size='default' onClick={this.onSubmit.bind(this)}>
              创建订单
           </Button>
            <Button className="ButtonBox" type="primary" size='default' onClick={this.exportExcel.bind(this)}>
              导出excel
           </Button>
          </Form.Item>
        </Form>
        <Table columns={this.state.columns} dataSource={this.state.data} pagination={false} />
        <Modal
          title="修改状态"
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <Radio.Group onChange={this.onRadioChange} value={this.state.editRow.status || 'wait'}>
            <Radio value={'wait'}>待处理</Radio>
            <Radio value={'ing'}>进行中</Radio>
            <Radio value={'done'}>已完成</Radio>
          </Radio.Group>
          <Divider dashed={true} />
          <TextArea rows={3} placeholder="请输入备注信息" value={this.state.editRow.desc || ''} onChange={this.onDescChange.bind(this)} />
        </Modal>
      </div>
    );
  }
}
