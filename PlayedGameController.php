<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\WithdrawalMoney;
use App\Models\PlayGame;
use Illuminate\Support\Facades\Log;
use App\Models\Transaction;
use Illuminate\Support\Facades\Storage;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;


class PlayedGameController extends Controller
{
    
    public function PlayGameAmountA(Request $request)
{
    try {
        $date = $request->date;

        $data = PlayGame::whereBetween('created_at', [businessStart($date), businessEnd($date)])
            ->with('category')
            ->select('category_id',
                \DB::raw('SUM(entered_amount) as total_entered_amount'),
                \DB::raw('SUM(won_amount) as total_won_amount'),
                \DB::raw('MIN(created_at) as created_date') // Get the earliest created date
            )
            ->groupBy('category_id')
            ->get()
            ->map(function ($game) {
                $profitOrLoss = $game->total_entered_amount - $game->total_won_amount; // Calculate Profit/Loss

                return [
                    'category_id' => $game->category_id,
                    'category_name' => $game->category->name ?? 'Unknown',
                    'total_entered_amount' => $game->total_entered_amount,
                    'total_won_amount' => $game->total_won_amount,
                    'profit_loss' => $profitOrLoss, // Profit or Loss Calculation
                    'created_date' => Carbon::parse($game->created_date)->format('d-m-Y'), // Format created_date
                ];
            });

        return response()->json(['status' => 200, 'data' => $data]);
    } catch (\Exception $e) {
        return response()->json(['status' => 500, 'message' => $e->getMessage()]);
    }
}
    public function PlayGameAmountAddMoney(Request $request)
{
    try {
        
        $date = $request->date;

        $totals = Transaction::whereBetween('created_at', [businessStart($date), businessEnd($date)])
            ->whereIn('transaction_type', ['withdrawal', 'credit'])
            ->selectRaw("
                SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END) as total_debit,
                SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as total_credit,
                MIN(created_at) as created_date
            ")
            ->first();

        $profitOrLoss = $totals->total_credit - $totals->total_debit;

        return response()->json([
            'status' => 200,
            'data' => [
                'total_debit' => $totals->total_debit,
                'total_credit' => $totals->total_credit,
                'profit_loss' => $profitOrLoss,
                'created_date' => \Carbon\Carbon::parse($totals->created_date)->format('d-m-Y'),
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['status' => 500, 'message' => $e->getMessage()]);
    }
}

    
    public function Deletegamehistory($gameId)
{
    try {
        // Attempt to delete the game record with the given gameId
        $delete = PlayGame::where('id', $gameId)->delete();

        // Check if the deletion was successful
        if ($delete) {
            return response()->json(['status' => 200, 'message' => 'Game history deleted successfully.']);
        } else {
            return response()->json(['status' => 404, 'message' => 'Game not found.'], 404);
        }
    } catch (\Exception $e) {
        // Catch any exception and return a JSON response with the error message
        return response()->json(['status' => 500, 'message' => 'Failed to delete game history. Please try again later.'], 500);
    }
}

    public function Transaction_Details($transaction_id)
    {
        // Retrieve the transaction details by ID
        $transaction = Transaction::find($transaction_id);

        if (!$transaction) {
            return response()->json([
                'status' => 404,
                'message' => 'Transaction not found',
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'data' => $transaction,
        ], 200);
    }
    
    public function Transaction_UpdateS(Request $request)
{
    try {
        // Validate the incoming request
        $validated = $request->validate([
            'transaction_id' => 'required|integer',
            'amount' => 'required|numeric', // Validate other fields as necessary
            // Add validation rules for other fields
        ]);

        // Begin a database transaction
        DB::beginTransaction();

        // Find the transaction by ID
        $transaction = Transaction::find($validated['transaction_id']);
    // dd($transaction);
        if (!$transaction) {
            // Rollback transaction in case of error
            DB::rollBack();
            return response()->json(['message' => 'Transaction not found'], 404);
        }

 
        // Fetch the user details
        $user = User::find($transaction->user_id);
    
        if (!$user) {
            DB::rollBack();
            return response()->json(['message' => 'User not found'], 404);
        }

        $transaction->amount = $validated['amount']; // Update other fields as necessary
        $transaction->available_balance -= $validated['amount'];
        $transaction->save();

        if ($user->balance >= $validated['amount']) {
            $user->balance -= $validated['amount'];
            $user->save();
        } else {
            DB::rollBack();
            $user->balance -= $validated['amount'];
            $user->save();
        }
        DB::commit();
        return response()->json(['message' => 'Transaction updated successfully', 'transaction' => $transaction], 200);
    } catch (ValidationException $e) {
        // Handle validation exception
        return response()->json([
            'message' => 'Validation failed',
            'errors' => $e->errors()
        ], 422); // 422 Unprocessable Entity
    } catch (\Exception $e) {
        // Rollback transaction in case of error
        DB::rollBack();
        // Handle other exceptions
        return response()->json(['message' => 'An error occurred', 'error' => $e->getMessage()], 500);
    }
}

public function User_Playing_Game(Request $request, $user_id)
{
    try {
        // Fetch all game history records for the given user ID
        $game_history = PlayGame::where('user_id', $user_id)->orderBy('id','desc')->get();
        // dd($game_history);
        // Check if game history is found
        if ($game_history->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No game history found for this user.'
            ], 404);
        }

        // Fetch all categories in a single query
        $categories = Category::all()->keyBy('id');

        // Map game history with category names
        $game_history_with_category = $game_history->map(function ($game) use ($categories) {
            $category = $categories->get($game->category_id);
            return [
                'id' => $game->id,
                'user_id' => $game->user_id,
                'user_name' => $game->user->name ?? 'Unknown',
                'category_id' => $game->category_id,
                'Playing_Name' => $category ? $category->name : 'Unknown', // Corrected this line
                'play_type' => $game->Playing_Name,
                'playinge_type' =>$game->play_type,
                'ander_harup' => $game->ander_harup,
                'bahar_harup' => $game->bahar_harup,
                'play_game_id' => $game->play_game_id,
                'today_number' => $game->today_number,
                'loss_amount' => $game->loss_amount,
                'won_amount' => $game->won_amount,
                'entered_number' => $game->entered_number,
                'entered_amount' => $game->entered_amount,
                'status' => $game->status,
                'created_at' => Carbon::parse($game->created_at)->format('d-m-Y H:i:s'),
                'updated_at' => Carbon::parse($game->updated_at)->format('d-m-Y H:i:s'),
            ];
        });

        // Return the game history with category names as a JSON response
        return response()->json([
            'success' => true,
            'data' => $game_history_with_category
        ], 200);
    } catch (\Exception $e) {
        dd($e);
        // Log the exception

        // Return a JSON response with error details
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch game history. Please try again later.'
        ], 500);
    }
}



    public function played_game(Request $request)
    {
        try {
            set_time_limit(400);
            // Validate request
            $validator = Validator::make($request->all(), [
                'category_id' => 'required|integer'
            ]);

            if ($validator->fails()) {
                return response()->json(['status' => 403, 'errors' => $validator->errors()], 403);
            }

            $validated = $validator->validated();
            $categoryId = $validated['category_id'];

            // Check if category is opened
            $category = Category::where('id', $categoryId)->where('status', 'opened')->first();
            if (!$category) {
                return response()->json(['status' => 404, 'message' => 'Category not found or not opened.'], 404);
            }

            $today_open_number = $category->no_open;
            $playedGames = PlayGame::where('category_id', $categoryId)->where('status', 'waiting')->get();

            if ($playedGames->isEmpty()) {
                return response()->json(['status' => 404, 'message' => 'No played games found for the given category.'], 404);
            }

            foreach ($playedGames as $game) {
                $play_game_id = $game->play_game_id;
                $user_entered_numbers = (string) $game->entered_number;
                $user_entered_amount = (float) $game->entered_amount;
                $user_id = $game->user_id;
                $play_types = $game->play_type;

                // Retrieve user
                $user = User::find($user_id);
                if (!$user) {
                    Log::warning("User not found for ID: $user_id, skipping game processing.");
                    continue;
                }

                $user_balance = $user->balance;
                $available_balance = $user_balance;

                $won_amount = 0;
                $loss_amount = 0;
                $status = 'waiting'; // Default status
                $transaction_type = 'loss'; // Default transaction type

                // Log values for debugging
                Log::info("Processing Game ID: $play_game_id with Entered Number: $user_entered_numbers, Today's Number: $today_open_number");

                // Process the game based on play_game_id
                switch ($play_game_id) {
                    case 1:
                    case 3:
                    case 4:
                        // Compare entered numbers with the open number
                        if ($today_open_number == $user_entered_numbers) {
                            $won_amount = $user_entered_amount * 95; // Adjust multiplier as needed
                            $available_balance += $won_amount; // Update available balance before creating the transaction
                            $status = 'won';
                            $transaction_type = 'won';
                        } else {
                            $loss_amount = $user_entered_amount;
                            $status = 'lost';
                            $transaction_type = 'loss';
                        }
                        break;

                    case 2:
                        // Compare entered numbers with the open number for specific play types
                        $check_today_numbers = (string) $today_open_number;
                        $first_today_number = $check_today_numbers[0] ?? null;
                        $second_today_number = $check_today_numbers[1] ?? null;
                        $first_today_value = (int) $first_today_number;
                        $second_today_value = (int) $second_today_number;
                        $today_entered_numbers = (int) $user_entered_numbers;

                        if ($play_types == 'ander_harup') {
                            if ($first_today_value == $today_entered_numbers) {
                                $won_amount = $user_entered_amount * 9.5;
                                $available_balance += $won_amount; // Update available balance before creating the transaction
                                $status = 'won';
                                $transaction_type = 'won';
                            } else {
                                $loss_amount = $user_entered_amount;
                                $status = 'lost';
                                $transaction_type = 'loss';
                            }
                        } elseif ($play_types == 'bahar_harup') {
                            if ($second_today_value == $today_entered_numbers) {
                                $won_amount = $user_entered_amount * 9.5;
                                $available_balance += $won_amount; // Update available balance before creating the transaction
                                $status = 'won';
                                $transaction_type = 'won';
                            } else {
                                $loss_amount = $user_entered_amount;
                                $status = 'lost';
                                $transaction_type = 'loss';
                            }
                        }
                        break;

                    default:
                        Log::warning("Unknown play_game_id: $play_game_id, skipping game processing.");
                        continue 2; // Skip processing for unknown play_game_id
                }

                if ($status === 'won') {
                    // This will also log the 'won' transaction
                    \App\Services\WalletService::addWinning($user, $won_amount, 'Game: ' . ucfirst($status));
                } else {
                    // For a loss, the amount was already deducted when played, but we log the loss event for history
                    Transaction::create([
                        'user_id' => $user_id,
                        'transaction_type' => 'loss',
                        'amount' => $loss_amount,
                        'description' => 'Game: Lost',
                        'transaction_date' => Carbon::now(),
                        'available_balance' => $user->balance
                    ]);
                }

                // Update played game status and amounts
                $game->update([
                    'status' => $status,
                    'won_amount' => $status === 'won' ? $won_amount : null,
                    'loss_amount' => $status === 'lost' ? $loss_amount : null
                ]);

                // Log after update
                Log::info("Updated Game ID: $play_game_id with Status: $status, Won Amount: $won_amount, Loss Amount: $loss_amount");
            }

            return response()->json(['status' => 200, 'data' => $playedGames, 'message' => 'Played games retrieved and updated successfully.'], 200);
        } catch (\Throwable $th) {
            // Handle exception
            Log::error("Error occurred: " . $th->getMessage());
            return response()->json(['status' => 500, 'message' => 'An error occurred while processing your request.'], 500);
        }
    }

    public function revoke_number(Request $request)
    {
        try {
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'category_id' => 'required|integer'
            ]);

            if ($validator->fails()) {
                return response()->json(['status' => 403, 'errors' => $validator->errors()], 403);
            }

            $validated = $validator->validated();
            $categoryId = $validated['category_id'];

            $category = Category::find($categoryId);
            if (!$category) {
                return response()->json(['status' => 404, 'message' => 'Category not found.'], 404);
            }

            // Revoke the number for the category
            $category->no_open = null;
            $category->status = 'not_opened';
            $category->save();

            // Revoke the TodayResult entry
            $todayResult = \App\Models\TodayResult::where('category_id', $categoryId)
                ->whereDate('created_at', businessDate())
                ->first();

            if ($todayResult) {
                $todayResult->open_number = null;
                $todayResult->save();
            }

            // Revert played games
            $playedGames = PlayGame::where('category_id', $categoryId)
                ->whereBetween('updated_at', [businessStart(), businessEnd()])
                ->whereIn('status', ['won', 'lost'])
                ->get();

            foreach ($playedGames as $game) {
                $user = User::find($game->user_id);
                if ($user) {
                    if ($game->status === 'won' && $game->won_amount > 0) {
                        \App\Services\WalletService::revertWinning($user, $game->won_amount, 'Game Reverted: Deduction for revoked number');
                    }

                    // For 'lost' games, they already lost the standard entered_amount money when they entered. We do NOT refund standard entered_amount here automatically unless they specifically want the entered money back. Typically, revoking sets it back to `waiting`. If a full refund is needed, we would credit the \`entered_amount\`. Assuming we just reset it to waiting:
                }

                $game->update([
                    'status' => 'waiting',
                    'won_amount' => null,
                    'loss_amount' => null
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 200, 
                'message' => 'Number revoked successfully and user balances updated.'
            ], 200);

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error("Error in revoke_number: " . $th->getMessage());
            return response()->json(['status' => 500, 'message' => 'An error occurred while processing your request.'], 500);
        }
    }

    private function updateUserBalance(User $user, $newBalance)
    {
        $user->balance = $newBalance;
        return $user->save();
    }



    public function result_today(Request $request)
    {
        try {
            // Validate the request data
            $validator = Validator::make($request->all(), [
                'id' => 'required|exists:categories,id',
                'no_open' => 'required|string',
                'status' => 'required|in:opened,not_opened', // Add your enum values here
            ]);

            // Check if validation fails
            if ($validator->fails()) {
                return response()->json([
                    'status' => 403,
                    'errors' => $validator->errors(),
                ]);
            }
            $validated = $validator->validated();
            $id = $validated['id'];
            $no_open = $validated['no_open'];
            $status = $validated['status'];
            $checkfor_cateory_open = Category::where('status', 'opened')->get();
            foreach ($checkfor_cateory_open as $open_status_o) {
                if ($open_status_o->status === 'opened') {
                    return response()->json(['status' => 403, 'message' => 'CLose all Category First Update']);
                }
            }
            $category_to_update = Category::find($id);
            $category_name = $category_to_update->name;
            $category_id_d = $category_to_update->id;
            if ($category_to_update) {
                $category_to_update->status = $status;
                $category_to_update->no_open = $no_open;
                $category_to_update->save();

                $checkAlreadyOpenResults = TodayResult::where('category_id', $id)
                    ->where('category_name', $category_to_update->name) // Assuming category_name is the name of the category
                    ->whereDate('created_at', businessDate()) // Only check the date part
                    ->first();

                if ($checkAlreadyOpenResults) {
                    // Update the existing entry
                    $checkAlreadyOpenResults->update([
                        'open_number' => $no_open,
                        'open_time' => Carbon::now(),
                    ]);
                } else {
                    // Create a new entry
                    TodayResult::create([
                        'category_id' => $id,
                        'category_name' => $category_to_update->name, // Assuming category_name is the name of the category
                        'open_number' => $no_open,
                        'open_time' => Carbon::now(),
                    ]);
                }
            }

            return response()->json([
                'status' => 200,
                'data' => 'Status updated successfully',
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'status' => 500,
                'message' => 'An error occurred. Please try again later.',
            ]);
        }
    }

    public function update_status(Request $request)
    {
        try {
            // Validate the request data
            $validator = Validator::make($request->all(), [
                'id' => 'required|exists:categories,id',
                'status' => 'required|in:opened,not_opened', // Add your enum values here
            ]);

            // Check if validation fails
            if ($validator->fails()) {
                return response()->json([
                    'status' => 403,
                    'errors' => $validator->errors(),
                ]);
            }

            // Retrieve validated data
            $validated = $validator->validated();
            $id = $validated['id'];
            $status = $validated['status'];

            // Find the category by id
            $category = Category::find($id);

            if ($category) {
                // Check if the category status is 'opened'
                if ($category->status === 'opened') {
                    // Update the category status
                    $category->status = $status;
                    $category->save();

                    return response()->json([
                        'status' => 200,
                        'data' => 'Status updated successfully',
                    ]);
                } else {
                    // Find the category which is currently 'opened'
                    $openedCategory = Category::where('status', 'opened')->first();

                    if ($openedCategory) {
                        return response()->json([
                            'status' => 403,
                            'data' => 'Status is not opened',
                            'opened_category' => [
                                'name' => $openedCategory->name,
                            ],
                        ], 403);
                    } else {
                        return response()->json([
                            'status' => 403,
                            'data' => 'Status is not opened and no other category is currently opened',
                        ], 403);
                    }
                }
            }

            return response()->json([
                'status' => 404,
                'data' => 'Category not found',
            ], 404);

        } catch (\Throwable $th) {
            // Log the exception for debugging

            return response()->json([
                'status' => 500,
                'message' => 'An error occurred. Please try again later.',
            ], 500);
        }
        
         
}


public function AdminDashboard(Request $request)
{
    try {
        $today = businessDate();

        // Today Request Money
        $today_request_money = Transaction::where('transaction_type', 'withdrawal')
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->sum('amount');
        $today_transaction_count = Transaction::where('transaction_type', 'withdrawal')
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->count();

        // Today Add Money (Excluding Refunds)
        $today_credit_money = Transaction::where('transaction_type', 'credit')
            ->where('description', '!=', 'Withdrawal rejected, amount refunded')
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->sum('amount');
        $today_count_credit_transaction = Transaction::where('transaction_type', 'credit')
            ->where('description', '!=', 'Withdrawal rejected, amount refunded')
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->count();
            
        // Today Rejected Withdrawal
        $today_reject_request_money = Transaction::whereIn('transaction_type', ['credit', 'refund', 'rejected'])
            ->where('description', 'Withdrawal rejected, amount refunded')
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->sum('amount');
        $today_reject_request_count = Transaction::whereIn('transaction_type', ['credit', 'refund', 'rejected'])
            ->where('description', 'Withdrawal rejected, amount refunded')
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->count();

        // Today Total Loss
        $today_total_loss_amount = Transaction::whereIn('transaction_type', ['loss', 'debit'])
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->sum('amount');
        $today_total_loss_count = Transaction::whereIn('transaction_type', ['loss', 'debit'])
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->count();

        // Users
        $total_user = User::where('role', 'user')->count();
        $total_user_today = User::where('role', 'user')
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->count();

        // Today Play Games
        $play_today_game = PlayGame::whereBetween('created_at', [businessStart(), businessEnd()])->sum('entered_amount');
        $play_today_count = PlayGame::whereBetween('created_at', [businessStart(), businessEnd()])->count();

        // Bonus Today
        $total_bonus_amount = Transaction::where('transaction_type', 'bonus')
            ->where('confirm_payment', '!=', 'not_confirm')
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->sum('amount');
        $total_bonus_count = Transaction::where('transaction_type', 'bonus')
            ->where('confirm_payment', '!=', 'not_confirm')
            ->whereBetween('created_at', [businessStart(), businessEnd()])
            ->count();

        // Total Money Added
        $total_money_added = Transaction::where('transaction_type', 'credit')
            ->where('description', '!=', 'Withdrawal rejected, amount refunded')
            ->sum('amount');
        $total_money_added_count = Transaction::where('transaction_type', 'credit')
            ->where('description', '!=', 'Withdrawal rejected, amount refunded')
            ->count();

        // Total Withdrawal
        $total_withdrawal = Transaction::where('transaction_type', 'withdrawal')
            ->sum('amount');
        $total_withdrawal_count = Transaction::where('transaction_type', 'withdrawal')
            ->count();

        // Total Transactions
        $total_amount_transaction = Transaction::sum('amount');
        $total_count_transaction = Transaction::count();

        return response()->json([
            'status' => 200,
            'data' => [
                'total_money_added' => round($total_money_added, 2),
                'total_money_added_count' => $total_money_added_count,
                'total_withdrawal' => round($total_withdrawal, 2),
                'total_withdrawal_count' => $total_withdrawal_count,
                'today_request_money' => round($today_request_money, 2),
                'today_transaction_count' => $today_transaction_count,
                'today_credit_money' => round($today_credit_money, 2),
                'today_count_credit_transaction' => $today_count_credit_transaction,
                'today_reject_request_money' => round($today_reject_request_money, 2),
                'today_reject_request_count' => $today_reject_request_count,
                'today_total_loss_amount' => round($today_total_loss_amount, 2),
                'today_total_loss_count' => $today_total_loss_count,
                'total_user' => $total_user,
                'total_user_today' => $total_user_today,
                'play_today_game' => round($play_today_game, 2),
                'play_today_count' => $play_today_count,
                'total_bonus_amount' => round($total_bonus_amount, 2),
                'total_bonus_count' => $total_bonus_count,
                'total_amount_transaction' => round($total_amount_transaction, 2),
                'total_count_transaction' => $total_count_transaction,
            ],
            'message' => 'Dashboard data fetched successfully',
        ]);

    } catch (\Throwable $th) {
        return response()->json([
            'status' => 500,
            'error' => $th->getMessage(),
        ]);
    }
}






// use Illuminate\Support\Facades\Storage;

public function all_request_money_list(Request $request)
{
    try {
        $perPage = 100;
        $page = $request->input('page', 1);

        // Get paginated withdrawal records ordered by ID desc
        $withdrawals = WithdrawalMoney::orderBy('id', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        // Collect user IDs for eager loading user data
        $userIds = $withdrawals->pluck('user_id')->unique()->toArray();

        // Load user data for these IDs in one query
        $users = User::whereIn('id', $userIds)
            ->select('id', 'name', 'mobile')
            ->get()
            ->keyBy('id');

        // Add user info and QR code URL to each withdrawal
        $withdrawals->getCollection()->transform(function ($withdrawal) use ($users) {
            $user = $users->get($withdrawal->user_id);

            $withdrawal->user_name = $user ? $user->name : null;
            $withdrawal->user_mobile = $user ? $user->mobile : null;

            if ($withdrawal->qr_code_image && Storage::disk('public')->exists($withdrawal->qr_code_image)) {
                // Use asset without 'public/' prefix because storage:link creates 'storage' symlink
                $withdrawal->qr_code_image_url = asset('storage/' . $withdrawal->qr_code_image);
            } else {
                $withdrawal->qr_code_image_url = null;
            }

            return $withdrawal;
        });

        return response()->json([
            'status' => 200,
            'data' => $withdrawals,
        ]);
    } catch (\Throwable $th) {
        return response()->json([
            'status' => 500,
            'error' => $th->getMessage()
        ]);
    }
}








public function Approved(Request $request)
{
    DB::beginTransaction();

    try {
        // Validate the request inputs
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:withdrawal_money,id',
            'payment_status' => 'required|string|in:approved,not_approved',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors(), 'status' => 403], 403);
        }

        $validated = $validator->validate();
        $withdrawal_id = $validated['id'];
        $payment_status = $validated['payment_status'];

        $check_status = WithdrawalMoney::find($withdrawal_id);

        if ($check_status) {
            $current_status = $check_status->withdrawal_money_status;
            $user_id = $check_status->user_id;  // Get the user_id from the withdrawal
            $user_find = User::where('id', $user_id)->first();  // Find the user by ID

            if ($current_status === 'not_accepted') {
                $withdrawal_amount = $check_status->amount;  // Assuming the amount field exists
                
                if ($payment_status === 'approved') {
                    // Check if user has sufficient balance
                    if ($user_find->balance >= $withdrawal_amount) {
                        // Deduct the balance
                        $user_find->balance -= $withdrawal_amount;
                        $user_find->save();

                        // Update withdrawal status
                        $check_status->withdrawal_money_status = $payment_status;
                        $check_status->save();

                        // Create transaction for approved payment
                        Transaction::create([
                            'user_id' => $user_find->id,
                            'transaction_type' => 'withdrawal',
                            'amount' => $withdrawal_amount,
                            'description' => 'Withdrawal approved',
                            'transaction_date' => Carbon::now(),
                            'available_balance' => $user_find->balance,
                        ]);

                        DB::commit();

                        return response()->json(['status' => 200, 'message' => 'Withdrawal request approved and balance deducted successfully']);
                    } else {
                        return response()->json(['status' => 400, 'message' => 'Insufficient balance']);
                    }
                } else {
                    // If not approved, only update the status and create a transaction
                    $check_status->withdrawal_money_status = $payment_status;
                    $check_status->save();

                    // Create transaction for not approved payment
                    Transaction::create([
                        'user_id' => $user_find->id,
                        'transaction_type' => 'withdrawal',
                        'amount' => $withdrawal_amount,
                        'description' => 'Withdrawal not approved',
                        'transaction_date' => Carbon::now(),
                        'available_balance' => $user_find->balance,
                    ]);

                    DB::commit();

                    return response()->json(['status' => 200, 'message' => 'Withdrawal request updated successfully']);
                }
            } else {
                return response()->json(['status' => 400, 'message' => 'Withdrawal request cannot be updated as it is already processed']);
            }
        } else {
            return response()->json(['status' => 404, 'message' => 'Withdrawal request not found']);
        }
    } catch (\Throwable $th) {
        dd($th);
        DB::rollBack();

        return response()->json(['status' => 500, 'error' => $th->getMessage()]);
    }
}
    public function update_withdrawal_req(Request $request)
{
    DB::beginTransaction();

    try {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:withdrawal_money,id',
            'payment_status' => 'required|string',
            'payment_screenshot' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors(), 'status' => 403], 403);
        }

        $validated = $validator->validate();
        $withdrawal_id = $validated['id'];
        $payment_status = $validated['payment_status'];

        $withdrawal = WithdrawalMoney::find($withdrawal_id);

        if (!$withdrawal) {
            return response()->json(['status' => 404, 'message' => 'Withdrawal request not found']);
        }

        if ($withdrawal->withdrawal_money_status !== 'not_accepted') {
            return response()->json(['status' => 400, 'message' => 'Withdrawal request already processed']);
        }

        $user = User::find($withdrawal->user_id);
        $withdrawal_amount = $withdrawal->request_money;

        if ($payment_status === 'approved') {
            if ($request->hasFile('payment_screenshot')) {
                $imagePath = $request->file('payment_screenshot')->store('payment_screenshots', 'public');
                $withdrawal->payment_screenshot = $imagePath;
            }

            // ✅ Update status to approved
            $withdrawal->withdrawal_money_status = 'approved';
            $withdrawal->save();

            // ✅ Log transaction (without balance deduction)
            Transaction::create([
                'user_id' => $user->id,
                'transaction_type' => 'withdrawal',
                'amount' => $withdrawal_amount,
                'description' => 'Withdrawal approved',
                'transaction_date' => Carbon::now(),
                'available_balance' => $user->balance,
            ]);

            DB::commit();
            return response()->json(['status' => 200, 'message' => 'Withdrawal approved successfully']);
        } else {
            // ✅ Refund amount to user
            $user->balance += $withdrawal_amount;
            $user->save();

            // ✅ Update status to not_approved
            $withdrawal->withdrawal_money_status = 'not_approved';
            $withdrawal->save();

            // ✅ Log credit transaction
            Transaction::create([
                'user_id' => $user->id,
                'transaction_type' => 'rejected',
                'amount' => $withdrawal_amount,
                'description' => 'Withdrawal rejected, amount refunded',
                'transaction_date' => Carbon::now(),
                'available_balance' => $user->balance,
            ]);

            DB::commit();
            return response()->json(['status' => 200, 'message' => 'Withdrawal rejected and amount refunded to user']);
        }

    } catch (\Throwable $th) {
        DB::rollBack();
        return response()->json(['status' => 500, 'error' => $th->getMessage()]);
    }
}




     public function Add_Money_To_wallet(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:0',
                'mobile' => 'required|exists:users,mobile'
            ]);

            if ($validator->fails()) {
                return response()->json(['status' => 403, 'error' => $validator->errors()]);
            }

            $validated = $validator->validate();
            $amount = $validated['amount'];
            $mobile = $validated['mobile'];

            $user = User::where('mobile', $mobile)->first();
            $user_id = $user->id;
            $referrer_id = $user->referrer_id;

            $updatedUser = \App\Services\WalletService::addDeposit($user, $amount, 'Add Money By Admin');

            // Referral bonus logic is now centralized in WalletService::addDeposit

            return response()->json([
                'status' => 200,
                'message' => 'Money added to wallet successfully.',
                'available_balance' => $updatedUser->balance
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => 500,
                'message' => 'An error occurred while adding money to the wallet.'
            ], 500);
        }
    }
    
    
        // Route::get('all-money-added-list',[PlayedGameController::class,'All_Transaction']);
        





public function All_Transaction(Request $request)
{
    try {
        // Start a query to fetch transactions with transaction_type 'credit'
        $query = Transaction::where('transaction_type', 'credit');

        // Apply filters based on user_id, name, and mobile number if provided in the request
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->has('name')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->input('name') . '%');
            });
        }

        if ($request->has('mobile')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('mobile', 'like', '%' . $request->input('mobile') . '%');
            });
        }

        // Calculate the total added amount for the filtered results
        $totalAddedAmount = $query->sum('amount');

        // Paginate the results and order by id in descending order
        $perPage = $request->input('per_page', 10); // Number of results per page, default is 10
        $currentPage = $request->input('page', 1); // Current page number, default is 1
        $allTransactions = $query->orderBy('id', 'desc')->paginate($perPage);

        // Loop through each transaction to fetch and append the user's name, mobile, and convert time to Asia timezone
        foreach ($allTransactions as $transaction) {
            $user_id = $transaction->user_id; // Get the user_id from the transaction
            $userDetails = User::where('id', $user_id)->select('name', 'mobile')->first(); // Fetch the user's name and mobile

            // Append user details to each transaction
            $transaction->user_name = $userDetails->name;
            $transaction->user_mobile = $userDetails->mobile;

            // Convert the created_at timestamp to Asia/Kolkata timezone (should already be set in config/app.php)
            $transaction->created_at = Carbon::parse($transaction->created_at)->setTimezone('Asia/Kolkata')->toDateTimeString();

            // Convert the transaction_date timestamp to Asia/Kolkata timezone (from UTC)
            $transaction->transaction_date = Carbon::parse($transaction->transaction_date)->setTimezone('Asia/Kolkata')->toDateTimeString();
        }

        // Get the URL for the next page
        $nextPageUrl = $allTransactions->nextPageUrl();

        // Return the transactions with a success response including pagination and total amount
        return response()->json([
            'status' => 'success',
            'data' => $allTransactions->items(),
            'total_added_amount' => $totalAddedAmount,
            'pagination' => [
                'current_page' => $allTransactions->currentPage(),
                'total_pages' => $allTransactions->lastPage(),
                'total_items' => $allTransactions->total(),
                'per_page' => $allTransactions->perPage(),
                'has_more_pages' => $allTransactions->hasMorePages(),
                'next_page_url' => $nextPageUrl,
            ],
        ], 200);
    } catch (\Exception $e) {
        // Handle any errors and return an error response
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch transactions. Please try again.',
            'error' => $e->getMessage(),
        ], 500);
    }
}





public function Delete_Game_History($id)
{
    try {
        // Find the PlayGame record by its ID
        $playGame = PlayGame::find($id);

        // Check if the record exists
        if (!$playGame) {
            return response()->json([
                'status' => 'error',
                'message' => 'Game history not found'
            ], 404); // 404 Not Found
        }

        // Delete the record
        $playGame->delete();

        // Return success response
        return response()->json([
            'status' => 'success',
            'message' => 'Game history deleted successfully'
        ]);
    } catch (\Throwable $th) {
        // Handle unexpected errors
        return response()->json([
            'status' => 'error',
            'message' => 'An error occurred while deleting the game history'
        ], 500); // 500 Internal Server Error
    }
}

public function UserStatus(Request $request)
{
    try {
        // Validate the request data
        $validatedData = $request->validate([
            'user_id' => 'required|exists:users,id', // Ensure user_id exists in the users table
            'user_status' => 'required|in:0,1' // Validate that status is either 0 or 1
        ]);

        $user_id = $validatedData['user_id'];
        $user_status = $validatedData['user_status']; // 1 for Unblock, 0 for Block

        // Find the user by ID and update their status
        $user = User::findOrFail($user_id); // This already ensures user exists
        $user->status = $user_status;
        $user->save();

        // Return success response
        return response()->json([
            'status' => 200,
            'message' => 'User status updated successfully.',
            'data' => [
                'user_id' => $user->id,
                'status' => $user->status
            ]
        ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
        // Handle validation errors
        return response()->json([
            'status' => 422,
            'error' => 'Validation failed.',
            'messages' => $e->errors() // Return detailed validation errors
        ]);
    } catch (\Throwable $th) {
        // Handle any other errors
        return response()->json([
            'status' => 500,
            'error' => 'An error occurred while updating user status.'
        ]);
    }
}

 

public function UserHistoryAllLisRef(Request $request) {
    try {
        $user_id = $request->user_id;
        // dd($user_id);
        $referrerCount = User::where('referrer_id', $user_id)->pluck('id');
        // dd($referrerCount);
        $all_user_inRef = User::whereIn('id', $referrerCount)->get();
    
        // Return the data as a JSON response
        return response()->json([ 
            'status' => 200, 
            'data' => [
                // 'all_transaction' => $all_transaction,
                'All_bonus' => $all_user_inRef
            ]
        ]);
        
    } catch (\Throwable $th) {
        // Handle any errors that occur during the process
        return response()->json(['status' => 500, 'error' => 'An error occurred while fetching data']);
    }
}


public function UserHistoryAllLis(Request $request) {
    try {
        $user_id = $request->user_id;
        $credit = $request->datatabs;
        
        // Fetch users whose referrer_id matches the user_id
        $referrerCount = User::where('referrer_id', $user_id)->pluck('id');
        
        // Fetch all users where their id is in the list of referrer IDs.
        $all_user_inRef = User::whereIn('id', $referrerCount)->get();
        
        // Check if $credit is null. If it is, fetch all data for the user, otherwise filter by transaction_type.
        if ($credit === null) {
            $all_transaction = Transaction::where('user_id', $user_id)->orderBy('id','desc')->get();
        } else {
            $all_transaction = Transaction::where('user_id', $user_id)
                ->where('transaction_type', $credit)
                ->get();
        }

        // If bonus data is found, add it to the all_transaction response
        if ($all_user_inRef->isNotEmpty()) {
            foreach ($all_transaction as $transaction) {
                // Add a new field `bonus` for each transaction, or append bonus data accordingly
                $transaction->bonus = $all_user_inRef; // You can modify this to associate specific bonus data per transaction if necessary
            }
        }

        // Return the data as a JSON response
        return response()->json([ 
            'status' => 200, 
            'data' => [
                'all_transaction' => $all_transaction,
                'All_bonus' => $all_user_inRef
            ]
        ]);
        
    } catch (\Throwable $th) {
        // Handle any errors that occur during the process
        return response()->json(['status' => 500, 'error' => 'An error occurred while fetching data']);
    }
}







    
    

    public function dailyWinLossStats(Request $request) {
        try {
            $date = $request->input('date');

            $winQuery = Transaction::where('transaction_type', 'won');
            $lossQuery = Transaction::whereIn('transaction_type', ['loss', 'debit']);
            $betQuery = PlayGame::query();

            if ($date) {
                $winQuery->whereDate('created_at', $date);
                $lossQuery->whereDate('created_at', $date);
                $betQuery->whereDate('created_at', $date);
            }

            $total_users_won = (clone $winQuery)->distinct('user_id')->count('user_id');
            $total_users_loss = (clone $lossQuery)->distinct('user_id')->count('user_id');
            
            $total_win_amount = (clone $winQuery)->sum('amount');
            $total_loss_amount = (clone $lossQuery)->sum('amount');
            
            $total_bet_amount = (clone $betQuery)->sum('entered_amount');

            $top_winner = (clone $winQuery)->with('user')
                ->orderBy('amount', 'desc')
                ->first();
                
            $bets_raw = PlayGame::select('user_id', \DB::raw('SUM(entered_amount) as total_bet'))
                ->when($date, function($query) use ($date) {
                    return $query->whereDate('created_at', $date);
                })
                ->groupBy('user_id')
                ->get()
                ->keyBy('user_id');

            $transactions_raw = Transaction::select('user_id',
                    \DB::raw("SUM(CASE WHEN transaction_type = 'won' THEN amount ELSE 0 END) as total_won"),
                    \DB::raw("SUM(CASE WHEN transaction_type IN ('loss', 'debit') THEN amount ELSE 0 END) as total_loss")
                )
                ->whereIn('transaction_type', ['won', 'loss', 'debit'])
                ->when($date, function($query) use ($date) {
                    return $query->whereDate('created_at', $date);
                })
                ->groupBy('user_id')
                ->get()
                ->keyBy('user_id');

            $userIds = $bets_raw->keys()->merge($transactions_raw->keys())->unique();
            $users = \App\Models\User::whereIn('id', $userIds)->get()->keyBy('id');

            $users_list = [];
            foreach ($userIds as $userId) {
                $user = $users->get($userId);
                $total_bet = $bets_raw->has($userId) ? $bets_raw->get($userId)->total_bet : 0;
                $total_won = $transactions_raw->has($userId) ? $transactions_raw->get($userId)->total_won : 0;
                $total_loss = $transactions_raw->has($userId) ? $transactions_raw->get($userId)->total_loss : 0;

                $users_list[] = [
                    'user_id' => $userId,
                    'user_name' => $user ? $user->name : 'Unknown',
                    'user_mobile' => $user ? $user->mobile : '-',
                    'total_bet' => round($total_bet, 2),
                    'total_won' => round($total_won, 2),
                    'total_loss' => round($total_loss, 2),
                ];
            }

            usort($users_list, function($a, $b) {
                return $b['total_won'] <=> $a['total_won'] ?: $b['total_bet'] <=> $a['total_bet'];
            });

            $data = [
                'date' => $date ? $date : 'All Time',
                'total_users_won' => $total_users_won,
                'total_users_loss' => $total_users_loss,
                'total_bet_amount' => round($total_bet_amount, 2),
                'total_win_amount' => round($total_win_amount, 2),
                'total_loss_amount' => round($total_loss_amount, 2),
                'top_winner_name' => $top_winner && $top_winner->user ? $top_winner->user->name : null,
                'top_winner_amount' => $top_winner ? round($top_winner->amount, 2) : 0,
                'users_list' => $users_list,
            ];

            return response()->json([
                'status' => 200,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Something went wrong',
                'error' => $e->getMessage()
            ]);
        }
    }

}