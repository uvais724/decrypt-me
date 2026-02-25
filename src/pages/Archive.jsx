import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
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
          sent: game.prompts?.sender?.username ?? 'Unknown',
          received: game.prompts?.receiver?.username ?? 'Unknown',
          message: game.prompts?.prompt_text ?? '',
          created_at: game.created_at
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
      { headerName: 'Sent', field: 'sent', sortable: true, filter: true, minWidth: 160, flex: 1 },
      { headerName: 'Received', field: 'received', sortable: true, filter: true, minWidth: 160, flex: 1 },
      { headerName: 'Message', field: 'message', sortable: true, filter: true, minWidth: 280, flex: 2 },
      {
        headerName: 'Created At',
        field: 'created_at',
        sortable: true,
        filter: true,
        minWidth: 200,
        flex: 1,
        valueFormatter: ({ value }) => (value ? new Date(value).toLocaleString() : '')
      }
    ],
    []
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
      <Navbar />
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
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
