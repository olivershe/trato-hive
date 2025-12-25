"use client";

import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useView } from './ViewContext'
import { Deal } from './mock-data'

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

export function CalendarView() {
    const { deals } = useView()

    const events = deals.map(deal => ({
        title: deal.title,
        start: deal.closingDate,
        end: deal.closingDate,
        resource: deal
    }))

    return (
        <div className="h-[600px] bg-white dark:bg-deep-grey rounded-lg border border-gold/20 p-4">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                defaultView={Views.MONTH}
                views={[Views.MONTH, Views.AGENDA]}
                style={{ height: '100%' }}
                eventPropGetter={(event) => {
                    const deal = event.resource as Deal;
                    let backgroundColor = '#E5E7EB'; // default gray
                    if (deal.stage === 'CLOSING') backgroundColor = '#10B981'; // emerald
                    if (deal.stage === 'DILIGENCE') backgroundColor = '#3B82F6'; // blue
                    if (deal.stage === 'SOURCING') backgroundColor = '#F59E0B'; // amber/gold

                    return {
                        style: {
                            backgroundColor,
                            color: 'white',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }
                    }
                }}
            />
        </div>
    )
}
