import { Tree} from 'react-arborist'
import { useValue } from 'signia-react'

import { useHistoryManager } from '@/providers/history'

export function Sidebar() {
  const historyManager = useHistoryManager()

  const history = useValue(
    'history',
    () => historyManager.threads,
    [historyManager],
  )

    return <div className="p-4">
        <button className="btn btn-primary" onClick={() => { historyManager.addThread({ id: Math.random().toString(), modelID: '', title: 'Chat X', createdAt: new Date() })}}>New Thread</button>
        <Tree initialData={history} width={228} rowHeight={30}>{Node}</Tree>
    </div>
}

function Node({ node, style, dragHandle }: { node: any; style: any; dragHandle: any; }) {
  /* This node instance can do many things. See the API reference. */
  return (
    <div style={style} ref={dragHandle} className="flex h-full items-center rounded text-sm transition hover:bg-gray-100 active:bg-gray-200">
      {/* <div className="w-6 text-center">{node.isLeaf ? "🍁" : "🗀"}</div> */}
      <div className="grow px-2">{node.data.title}</div>
    </div>
  );
}