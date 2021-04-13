import { Fragment, FunctionComponent, h } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import range from 'tui-code-snippet/array/range';

import { cls } from '@src/util/cssHelper';
import { addDate, isEventWithinRange } from '@src/time/datetime';
import { Grid } from '@src/components/panel/grid';
import { Day, Schedules, Task } from '@src/components/panel/schedules';
import TZDate from '@src/time/date';
import {
  PanelDispatchStore,
  PanelStateStore,
  UPDATE_MAX_SCHEDULE_HEIGHT_MAP,
} from '@src/components/layout';

const PANEL_TITLE_CLASS_NAME = cls('panel-title');
const PANEL_MILESTONE_CLASS_NAME = cls('panel-milestone');
const DEFAULT_PANEL_HEIGHT = 20;
const DEFAULT_SCHEDULE_HEIGHT = 20;
const defaultPanelInfoList: TZDate[] = range(0, 7).map((day) => {
  const now = new TZDate();

  return addDate(now, day - now.getDay());
});

interface Props {
  events: Task[];
  gridInfoList?: TZDate[];
  timesWidth?: number;
  timezonesCount?: number;
}

export const Milestone: FunctionComponent<Props> = ({
  events,
  gridInfoList = defaultPanelInfoList,
  timesWidth = 120,
  timezonesCount = 1,
}) => {
  const columnWidth = timesWidth * timezonesCount;
  const dispatch = useContext(PanelDispatchStore);
  const { milestone } = useContext(PanelStateStore);
  const height = milestone?.height ?? DEFAULT_PANEL_HEIGHT;
  const scheduleHeight = milestone?.scheduleHeight ?? DEFAULT_SCHEDULE_HEIGHT;

  const startDate = gridInfoList[0].getDate();
  const endDate = gridInfoList[gridInfoList.length - 1].getDate();
  const filteredEvents = events.filter((event) => isEventWithinRange(event, startDate, endDate));

  useEffect(() => {
    const maxScheduleHeightMap = [0, 0, 0, 0, 0, 0, 0];

    const getTop = (start: number, end: number, heightMap: number[]) => {
      const scheduleTopList = heightMap.filter((_, index) => start <= index && index <= end);

      return Math.max(...scheduleTopList);
    };
    const isStartOnPrevWeek = (startDay: number, endDay: number, scheduleStartDate: number) => {
      return startDay > endDay && scheduleStartDate < startDate;
    };
    const isEndOnNextWeek = (startDay: number, endDay: number, scheduleStartDate: number) => {
      return startDay > endDay && scheduleStartDate >= startDate;
    };
    const isOnCurrentWeek = (startDay: number, endDay: number) => {
      return startDay <= endDay;
    };
    const updateScheduleHeightMap = ({ start, end }: Task, map: number[]) => {
      const scheduleStartDate = start.getDate();
      const startDay = start.getDay();
      const endDay = end.getDay();
      let top: number;

      if (isStartOnPrevWeek(startDay, endDay, scheduleStartDate)) {
        top = getTop(Day.SUN, endDay, map);
        map.forEach((_, index) => {
          if (Day.SUN <= index && index <= endDay) {
            map[index] = top + 1;
          }
        });
      }

      if (isEndOnNextWeek(startDay, endDay, scheduleStartDate)) {
        top = getTop(startDay, Day.SAT, map);
        map.forEach((_, index) => {
          if (startDay <= index && index <= Day.SAT) {
            map[index] = top + 1;
          }
        });
      }

      if (isOnCurrentWeek(startDay, endDay)) {
        top = getTop(startDay, endDay, map);
        map.forEach((_, index) => {
          if (startDay <= index && index <= endDay) {
            map[index] = top + 1;
          }
        });
      }
    };

    filteredEvents.forEach((event) => {
      updateScheduleHeightMap(event, maxScheduleHeightMap);
    });

    dispatch({
      type: UPDATE_MAX_SCHEDULE_HEIGHT_MAP,
      panelType: 'milestone',
      state: {
        maxScheduleHeightMap,
      },
    });

    console.log('milestone', milestone);
  }, [dispatch, filteredEvents, height, milestone, scheduleHeight, startDate]);

  return (
    <Fragment>
      <div className={PANEL_TITLE_CLASS_NAME} style={{ width: columnWidth }}>
        Title
      </div>
      <div className={PANEL_MILESTONE_CLASS_NAME}>
        <Grid
          name="milestone"
          gridInfoList={gridInfoList}
          maxScheduleHeightMap={milestone.maxScheduleHeightMap}
          renderedScheduleHeightMap={milestone.renderedScheduleHeightMap}
        />
        <Schedules
          name="milestone"
          gridInfoList={gridInfoList}
          events={filteredEvents}
          height={height}
          scheduleHeight={scheduleHeight}
        />
      </div>
    </Fragment>
  );
};
