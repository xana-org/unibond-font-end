import {
    Flex,
} from "@chakra-ui/core";
import { BarChart, ResponsiveContainer, XAxis, Tooltip, Bar } from 'recharts'
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

const CustomBar = ({
    x,
    y,
    width,
    height,
    fill,
  }) => {
    return (
      <g>
        <rect x={x} y={y} fill={fill} width={width} height={height} rx="2" />
      </g>
    )
  }
const Chart = (props) => {
    const {
        data,
        setLabel,
        setValue,
        value,
        label,
        minHeight,
        color,
    } = props;
    const parsedValue = value
    return (
        <Flex width="100%" minH={minHeight} flexDirection="column" padding="1rems">
            <ResponsiveContainer
                width="100%"
            >
                <BarChart
                    width={500}
                    height={300}
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                    onMouseLeave={() => {
                        setLabel && setLabel(undefined)
                        setValue && setValue(undefined)
                    }}
                    >
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(time) => dayjs(time).format('DD')}
                        minTickGap={10}
                    />
                    <Tooltip
                        cursor={{ fill: "#ccc" }}
                        contentStyle={{ display: 'none' }}
                        formatter={(value, name, props) => {
                        if (setValue && parsedValue !== props.payload.value) {
                            setValue(props.payload.value)
                        }
                        const formattedTime = dayjs(props.payload.time).format('MMM D, YYYY')
                        if (setLabel && label !== formattedTime) setLabel(formattedTime)
                        }}
                    />
                    <Bar
                        dataKey="value"
                        fill={color}
                        shape={(props) => {
                        return <CustomBar height={props.height} width={props.width} x={props.x} y={props.y} fill={color} />
                        }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </Flex>
    )
}

export default Chart;
