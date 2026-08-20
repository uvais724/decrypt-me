import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/useAuth';
import Loading from '../components/Loading';
import { AgGridReact } from 'ag-grid-react';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function Archive() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    const fetchArchive = async () => {
      try {
        setLoading(true);
        setError('');

        const { data, error: queryError } = await supabase
            .from('games')
            .select(`
                game_id,
                status,
                started_at,
                prompts!inner(
                prompt_text,
                sender_id,
                receiver_id,
                sender:users!prompts_sender_id_fkey(username),
                receiver:users!prompts_receiver_id_fkey(username)
                )
            `)
            .eq('status', 'SOLVED')
            .or(
                `sender_id.eq.${user.id},receiver_id.eq.${user.id}`,
                { foreignTable: 'prompts' }
            )
            .order('started_at', { ascending: false });

        if (queryError) throw queryError;

        const mappedRows = (data ?? []).map((game) => ({
          gameId: game.game_id,
          sentUserId: game.prompts?.sender_id ?? null,
          receivedUserId: game.prompts?.receiver_id ?? null,
          sent: game.prompts?.sender?.username ?? 'Unknown',
          received: game.prompts?.receiver?.username ?? 'Unknown',
          message: game.prompts?.prompt_text ?? '',
          started_at: game.started_at
        }));

        setRows(mappedRows);
      } catch (fetchError) {
        console.error('Error fetching archive:', fetchError);
        setError('Failed to load archive data.');
      } finally {
        setLoading(false);
      }
    };

    fetchArchive();
  }, [user?.id]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Sent',
        field: 'sent',
        sortable: true,
        filter: true,
        minWidth: 160,
        flex: 1,
        cellRenderer: (params) => {
          const isCurrentUser = params.data?.sentUserId === user?.id;
          return (
            <span className={isCurrentUser ? 'font-bold text-indigo-600' : ''}>
              {params.value}
            </span>
          );
        }
      },
      {
        headerName: 'Received',
        field: 'received',
        sortable: true,
        filter: true,
        minWidth: 160,
        flex: 1,
        cellRenderer: (params) => {
          const isCurrentUser = params.data?.receivedUserId === user?.id;
          return (
            <span className={isCurrentUser ? 'font-bold text-indigo-600' : ''}>
              {params.value}
            </span>
          );
        }
      },
      {
        headerName: 'Message',
        field: 'message',
        sortable: true,
        filter: true,
        minWidth: 280,
        flex: 2,
        cellClass: 'cursor-pointer text-primary underline underline-offset-2'
      },
      {
        headerName: 'Started At',
        field: 'started_at',
        sortable: true,
        filter: true,
        minWidth: 200,
        flex: 1,
        valueFormatter: ({ value }) => (value ? new Date(value).toLocaleString() : '')
      }
    ],
    [user?.id]
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true
    }),
    []
  );

  if (loading) return <Loading />;

  return (
    <>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-extrabold mb-6">Solved Games Archive</h1>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            {rows.length === 0 ? (
              <p className="text-neutral italic">No solved games found for your account yet.</p>
            ) : (
              <div className="ag-theme-alpine w-full" style={{ height: 520 }}>
                <AgGridReact
                  rowData={rows}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  pagination={true}
                  paginationPageSize={10}
                  animateRows={true}
                  onCellClicked={(params) => {
                    if (params.colDef.field === 'message' && params.value) {
                      setSelectedMessage(params.value);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <dialog className={`modal ${selectedMessage ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl border border-indigo-200 bg-base-100 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold text-indigo-700">Archived Message</h3>
              <p className="text-sm text-base-content/70">Full puzzle text from this solved game.</p>
            </div>
            <span className="badge badge-primary badge-outline">History</span>
          </div>

          <div className="mt-4 max-h-[52vh] overflow-y-auto rounded-xl border border-base-300 bg-base-200/60 p-4">
            <p className="whitespace-pre-wrap wrap-break-word leading-relaxed text-base-content">
              {selectedMessage}
            </p>
          </div>

          <div className="modal-action">
            <button className="btn btn-primary" onClick={() => setSelectedMessage('')}>Close</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close message dialog" onClick={() => setSelectedMessage('')}>
            close
          </button>
        </form>
      </dialog>
    </>
  );
}
