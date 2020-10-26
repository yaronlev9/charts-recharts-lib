import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, YAxis, Legend } from 'recharts';
import { PieChart, Pie, Sector } from 'recharts';
import '../App.css';


const colors = ["blue", "red", "green"];

function csvJSON(csv) {
    const lines = csv.split('\n')
    const result = []
    const headers = lines[0].split(',')

    for (let i = 1; i < lines.length; i++) {        
        if (!lines[i])
            continue
        const obj = {}
        const currentline = lines[i].split(',')
        obj[headers[0]] = currentline[0];
        obj[headers[1]] = currentline[1];
        obj[headers[2]] = currentline[2];
        obj[headers[3]] = currentline[3];
        obj["dates"] = [];
        for (let j = 4; j < headers.length; j++) {
            const date = headers[j].split('/');
            obj["dates"].push({"date" : `${date[1]}/${date[0]} `, "infected" : Number.parseInt(currentline[j])});
        }
        result.push(obj)
    }
    return result
}

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="black">{payload.name}</text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="lime"
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill="lime"
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="black">{`${value}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="black">
          {`${(percent * 100).toFixed(2)}%`}
        </text>
      </g>
    );
  };


function Charts(props){
    const [option1, setOption1] = useState();
    const [option2, setOption2] = useState();
    const [fullData, setFullData] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [pieData, setPieData] = useState([]);
    const [datesArr, setDatesArr] = useState([]);
    const [curDate, setCurDate] = useState();
    const [countrySearch, setCountrySearch] = useState();

    async function getData(){
        const data = await axios.get('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv');
        const jsonData = csvJSON(data.data);
        let dates = [];
        for (const date of jsonData[0].dates) {
            dates.push(date.date);
        }
        setDatesArr(dates);
        setFullData(jsonData);
    }

    function getPieData(e){
        setCurDate(e.target.value);
        let pieData = [];
        for (const country of fullData) {
            for (const date of country.dates){
                if (e.target.value === date.date){
                    pieData.push({name:country['Province/State'] + ' ' + country['Country/Region'], infected:date["infected"]})
                    break;
                }
            }
        }
        setPieData(pieData);
    }

    function onPieEnter (data, index){
        setActiveIndex(index);
      };

    function setOption(e, num){
        const province = e.target.value.split(':')[0];
        const country = e.target.value.split(':')[1];
        const result = fullData.filter(item =>  item['Province/State'] === province && item['Country/Region'] === country);
        if (num === 1){
            setOption1(result[0]);
        }
        else {
            setOption2(result[0]);
        }
    };

    function getSearch(e){
        setCountrySearch(e.target.value);
        for (let i = 0; i < pieData.length; i++) {
            const name = pieData[i].name.toLowerCase();
            if (name.includes(e.target.value)){
                onPieEnter(pieData[i], i);
                break;
            };
        }
    }

    useEffect( () => { 
        getData();
        const dataInterval = setInterval(getData, 60000);
        return () => clearInterval(dataInterval);
      }, []);
        
    return(
        <div>
            <select className = "first" onChange={(e, num) => setOption(e, 1)}>
                <option>choose country ...</option>
            {fullData.map(country => <option value={country['Province/State'] + ':' + country['Country/Region']}>{country['Province/State'] + ' ' + country['Country/Region']}</option>)}
            </select>
            {option1 && <select className = "second" onChange={(e, num) => setOption(e, 2)}>
            <option>choose country ...</option>
            {fullData.filter(country => country['Province/State'] !== option1['Province/State'] || country['Country/Region'] !== option1['Country/Region']).map(country => <option value={country['Province/State'] + ':' + country['Country/Region']}>{country['Province/State'] + ' ' + country['Country/Region']}</option>)}
            </select>}
            <br/>
            {(option1 && option2) && <div> <h3>Number of infected over days</h3><LineChart className="chart1" width={1000} height={600}>
                            <CartesianGrid/>
                            <XAxis dataKey="date" allowDuplicatedCategory={false}/>
                            <YAxis className = "Yaxis" dataKey="infected"/>
                            <Tooltip />
                            <Legend />
                            {[option1, option2].map((s, index) => (
                            <Line dataKey="infected" data={s["dates"]} name={s['Province/State'] + ' ' + s['Country/Region']} key={index} stroke =  {colors[index]}/>
                            ))}
                        </LineChart></div>
            }
            <br/>
            <select onChange={e => getPieData(e)}>
                <option>choose date ...</option>
            {datesArr.map(date => <option value={date}>{date}</option>)}
            </select>
            {curDate && <input style={{width:"150px"}} type="text" id="name" onChange={(e) => getSearch(e)} placeholder="enter country name"/>}
            {curDate && <h3>Number of infected in every country
            <PieChart className="chart2" width={800} height={600}>
                <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={pieData}
                cx={400}
                cy={250}
                innerRadius={140}
                outerRadius={230}
                fill="cyan"
                dataKey="infected"
                onMouseEnter={onPieEnter}
                />
            </PieChart></h3>}
        </div>
    );
}


export default Charts;