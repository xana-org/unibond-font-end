import {
    Flex,
} from "@chakra-ui/core";
import { ResponsiveContainer, XAxis, Tooltip, AreaChart, Area } from 'recharts'
import { darken } from 'polished'
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

const LineChart = (props) => {
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
                <AreaChart
                    width={600}
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
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={darken(0.36, color)} stopOpacity={0.5} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(time) => dayjs(time).format('DD')}
                        minTickGap={10}
                    />
                    <Tooltip
                        cursor={{ stroke: "#ccc" }}
                        contentStyle={{ display: 'none' }}
                        formatter={(value, name, props) => {
                        if (setValue && parsedValue !== props.payload.value) {
                            setValue(props.payload.value)
                        }
                        const formattedTime = dayjs(props.payload.time).format('MMM D, YYYY')
                        if (setLabel && label !== formattedTime) setLabel(formattedTime)
                        }}
                    />
                    <Area dataKey="value" type="monotone" stroke={color} fill="url(#gradient)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </Flex>
    )
}

export default LineChart;
