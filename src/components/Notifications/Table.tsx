import './Table.scss';

import { Button, ButtonVariant } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
import {
    expandable,
    ICell,
    IRow,
    IRowData,
    RowWrapperProps,
    Table,
    TableBody,
    TableHeader
} from '@patternfly/react-table';
import { global_spacer_md, global_spacer_sm } from '@patternfly/react-tokens';
import { joinClasses, OuiaComponentProps } from '@redhat-cloud-services/insights-common-typescript';
import { assertNever } from 'assert-never';
import * as React from 'react';
import { cssRaw, style } from 'typestyle';

import { Messages } from '../../properties/Messages';
import { Notification } from '../../types/Notification';
import { getOuiaProps } from '../../utils/getOuiaProps';
import { ActionComponent } from './ActionComponent';
import { Recipient } from './Recipient';
import { GroupByEnum } from './Types';

const pfBorderBottomClassName = style({
    borderBottom: 'var(--pf-c-table--border-width--base) solid var(--pf-c-table--BorderColor)'
});

const noBorderBottom = style({
    borderBottom: 'none !important'
});

const cellPaddingBottom = style({
    paddingBottom: '0 !important'
});

const actionCellStyle = style({
    paddingLeft: `${global_spacer_md.var} !important`
});

const cellPaddingBottomStyle = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '--pf-c-table__expandable-row-content--PaddingBottom': '0'
} as any;

const cellPaddingTop = style({
    paddingTop: `${global_spacer_sm.var} !important`
} as any);

const cellPaddingTopStyle = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '--pf-c-table__expandable-row-content--PaddingTop': '0'
} as any;

const grayFontClassName = style({
    color: '#888'
});

const noExpandableBorderClassName = style({
    $nest: {
        '&:after': {
            borderLeft: 'none !important',
            paddingBottom: '0 !important'
        }
    }
});

const componentClassName = 'notification-table';

cssRaw(`
.${componentClassName} table {
    --pf-c-table--m-compact__expandable-row-content--PaddingTop: ${global_spacer_sm.var};
    --pf-c-table--m-compact__expandable-row-content--PaddingBottom: ${global_spacer_sm.var};
}
`);

const applicationGroupClassName = style({
    fontWeight: 600
});

const columns: Array<ICell> = [
    {
        title: Messages.components.notifications.table.columns.event,
        transforms: [ ],
        cellFormatters: [ expandable ]
    },
    {
        title: Messages.components.notifications.table.columns.action,
        transforms: []
    },
    {
        title: Messages.components.notifications.table.columns.recipient,
        transforms: []
    },
    {
        title: ''
    }
];

export interface NotificationsTableProps extends OuiaComponentProps {
    notifications: NotificationRows;
    onCollapse: (index: number, isOpen: boolean) => void;
    onEdit?: OnEditNotification;
}

type NotificationRowBase = {
    loadingActionStatus: 'loading' | 'done' | 'error';
}

export type NotificationRowGroupedByNone = Notification & NotificationRowBase;

export interface NotificationRowGroupedByApplication {
    applicationDisplayName: string;
    notifications: Array<NotificationRowGroupedByNone>;
    isOpen: boolean;
}

export type NotificationRows = {
    grouped: GroupByEnum.Application;
    data: Array<NotificationRowGroupedByApplication>;
} | {
    grouped: GroupByEnum.None;
    data: Array<NotificationRowGroupedByNone>;
}

export type OnEditNotification = (notification: Notification) => void;

interface EventCellProps {
    eventTypeDisplayName: string;
    applicationDisplayName: string;
}

const EventCell: React.FunctionComponent<EventCellProps> = (props) => (
    <>
        <div> { props.eventTypeDisplayName } </div>
        <div className={ grayFontClassName }> { props.applicationDisplayName } </div>
    </>
);

const RowWrapper: React.FunctionComponent<RowWrapperProps> = (props) => {
    const { trRef, className, rowProps, row, ...rest } = props;
    if (!row) {
        return <></>;
    }

    const rowClassName = (row as any).props?.className ? (row as any).props.className : '';

    return (
        <tr
            { ...rest }
            ref={ trRef as any }
            className={ css(
                className,
                row.isExpanded !== undefined && styles.tableExpandableRow,
                row.isExpanded && styles.modifiers.expanded,
                rowClassName
            ) }
            hidden={ row?.isExpanded !== undefined && !row.isExpanded }
        >
            { props.children }
        </tr>
    );
};

const toTableRowsGroupedByNone = (notifications: Array<NotificationRowGroupedByNone>, onEdit?: OnEditNotification, parent?: number) => {
    return notifications.reduce((rows, notification) => {
        const rowSpan = Math.max(1, notification.useDefault ? 1 : notification.actions?.length ?? 0);
        const firstAction = notification.actions?.length ? notification.actions[0] : undefined;

        rows.push({
            id: `${parent !== undefined ? (parent.toString() + '-') : ''}${notification.id}`,
            key: `${parent !== undefined ? (parent.toString() + '-') : ''}${notification.id}`,
            cells: [
                {
                    title: <EventCell
                        applicationDisplayName={ notification.applicationDisplayName }
                        eventTypeDisplayName={ notification.eventTypeDisplayName }
                    />,
                    props: {
                        rowSpan,
                        className: joinClasses(
                            noExpandableBorderClassName,
                            pfBorderBottomClassName
                        ),
                        colSpan: parent === undefined ? 1 : 2
                    }
                },
                {
                    title: <><span><ActionComponent
                        isDefault={ !!notification.useDefault }
                        action={ firstAction }
                        loading={ notification.loadingActionStatus === 'loading' }
                        hasError={ notification.loadingActionStatus === 'error' }
                    /></span></>,
                    props: {
                        className: joinClasses(actionCellStyle, cellPaddingBottom),
                        style: cellPaddingBottomStyle
                    }
                },
                {
                    title: <><span>{ firstAction && <Recipient action={ firstAction } /> }</span></>,
                    props: {
                        className: cellPaddingBottom,
                        style: cellPaddingBottomStyle
                    }
                },
                {
                    title: <><Button
                        onClick={ () => onEdit && onEdit(notification) } isDisabled={ !onEdit }
                        variant={ ButtonVariant.link }>Edit</Button></>,
                    props: {
                        className: cellPaddingBottom,
                        style: cellPaddingBottomStyle
                    }
                }
            ],
            props: {
                className: notification.actions?.length && notification.actions.length > 1 ? noBorderBottom : ''
            }
        });

        if (parent !== undefined) {
            rows[rows.length - 1].parent = parent;
            rows[rows.length - 1].fullWidth = true;
        }

        for (let i = 1; i < rowSpan; ++i) {
            if (notification.actions === undefined || notification.actions[i] === undefined) {
                throw new Error(`Undefined notification.actions at index ${i}. ${notification.actions}`);
            }

            const classNames = joinClasses(
                (i + 1 === rowSpan ? '' : cellPaddingBottom),
                cellPaddingTop
            );
            const id = `${notification.id}-action-${i}`;
            const cssStyle = {
                ...cellPaddingTopStyle,
                ...(i + 1 === rowSpan ? {} : cellPaddingBottomStyle)
            };
            rows.push({
                id: `${parent !== undefined ? (parent.toString() + '-') : ''}${id}`,
                key: `${parent !== undefined ? (parent.toString() + '-') : ''}${id}`,
                cells: [
                    {
                        title: <ActionComponent
                            isDefault={ !!notification.useDefault }
                            action={ notification.actions[i] }
                            loading={ notification.loadingActionStatus === 'loading' }
                            hasError={ notification.loadingActionStatus === 'error' }
                        />,
                        props: {
                            className: joinClasses(
                                noExpandableBorderClassName,
                                classNames,
                                actionCellStyle
                            ),
                            style: cssStyle
                        }
                    },
                    {
                        title: <Recipient action={ notification.actions[i] } />,
                        props: {
                            className: classNames,
                            style: cssStyle
                        }
                    },
                    {
                        props: {
                            className: classNames,
                            style: cssStyle
                        }
                    }
                ],
                props: {
                    className: (i + 1 === rowSpan ? '' : noBorderBottom)
                }
            });

            if (parent !== undefined) {
                rows[rows.length - 1].parent = parent;
                rows[rows.length - 1].fullWidth = true;
            }
        }

        return rows;
    }, [] as Array<IRow>);
};

const toTableRowsGroupedByApplication = (applicationGroups: Array<NotificationRowGroupedByApplication>, onEdit?: OnEditNotification): Array<IRow> =>
    applicationGroups.reduce((rows, applicationGroup) => {
        rows.push({
            id: applicationGroup.applicationDisplayName,
            key: applicationGroup.applicationDisplayName,
            cells: [
                {
                    title: <span className={ applicationGroupClassName }> Application: { applicationGroup.applicationDisplayName }</span>,
                    props: {
                        className: noExpandableBorderClassName
                    }
                },
                {
                    title: '',
                    props: {
                        colSpan: columns.length - 1
                    }
                }
            ],
            isOpen: applicationGroup.isOpen
        });

        rows.push(...toTableRowsGroupedByNone(applicationGroup.notifications, onEdit, rows.length - 1));

        return rows;
    }, [] as Array<IRow>);

export const NotificationsTable: React.FunctionComponent<NotificationsTableProps> = (props) => {

    const rows = React.useMemo(() => {
        const notifications = props.notifications;
        switch (notifications.grouped) {
            case GroupByEnum.Application:
                return toTableRowsGroupedByApplication(notifications.data, props.onEdit);
            case GroupByEnum.None:
                return toTableRowsGroupedByNone(notifications.data, props.onEdit);
            default:
                assertNever(notifications);
        }

    }, [ props.notifications, props.onEdit ]);

    const onCollapseHandler = React.useCallback((_event, _index: number, isOpen: boolean, data: IRowData) => {
        const notifications = props.notifications;
        const onCollapse = props.onCollapse;

        if (notifications.grouped === GroupByEnum.None) {
            throw new Error('Invalid group None for CollapseHandler');
        }

        const index = notifications.data.findIndex(n => n.applicationDisplayName === data.id);
        if (onCollapse && index !== undefined && index !== -1) {
            onCollapse(index, isOpen);
        }

    }, [ props.onCollapse, props.notifications ]);

    return (
        <div { ...getOuiaProps('Notifications/Table', props) } className={ componentClassName }>
            <Table
                aria-label={ Messages.components.notifications.table.title }
                rows={ rows }
                cells={ columns }
                onCollapse={ onCollapseHandler }
                rowWrapper={ RowWrapper as (props: RowWrapperProps) => React.ReactElement }
                variant="compact"
            >
                <TableHeader />
                <TableBody />
            </Table>
        </div>
    );
};
