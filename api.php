<?php

use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\Admin\CategoryController;
use App\Http\Controllers\API\Admin\PlayedGameController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\User\AllTransactionController;
use App\Http\Controllers\API\User\CategoryControllerUser;
use App\Http\Controllers\API\User\PlayGameController;
use App\Http\Controllers\RegisterControllerRefferal;
use App\Http\Controllers\API\AppSettingController;
use App\Http\Controllers\API\ChatController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
 */

// Public Routes
Route::post('leads', [App\Http\Controllers\LeadController::class, 'store']);
Route::post('signup', [RegisterControllerRefferal::class, 'Signup']);
Route::post('login', [RegisterControllerRefferal::class, 'login']);

Route::get('app-settings', [AppSettingController::class, 'getSettings']);

Route::post('add-data-number',[RegisterControllerRefferal::class,'AddWhatsAppNumber']);

Route::get('today-numbers-history',[RegisterControllerRefferal::class,'all_frontend_numbers']);
Route::get('all-months-results',[RegisterControllerRefferal::class,'all_frontend_months']);
// User Routes (Authenticated with Sanctum and check.user.type:user middleware)
Route::prefix('user')->middleware(['auth:sanctum', 'check.user.type:user'])->group(function () {
    // User Management
    Route::get('profile', [UserController::class, 'dashboard']);
    Route::get('all-transaction', [AllTransactionController::class, 'alltransaction']);
    Route::post('add-money', [RegisterControllerRefferal::class, 'add_money']);
    Route::post('user-logout', [RegisterControllerRefferal::class, 'user_logout']);
    Route::put('change-password', [RegisterControllerRefferal::class, 'change_password']);
    
    
    //get content for 
    
    Route::get('home-content',[CategoryControllerUser::class,'Content_Game']);
    // Category and Play Game Management
    Route::get('play-games-haruf', [CategoryControllerUser::class, 'play_game_haruf']);
    Route::get('play-game-crossing', [CategoryControllerUser::class, 'play_Crossing_Game']);
    Route::get('play-game-jodi', [CategoryControllerUser::class, 'Play_Game_Jodi']);
    Route::get('get-category', [CategoryControllerUser::class, 'index']);
    Route::post('add-money-to-wallet', [PlayGameController::class, 'Add_money']);
    Route::post('withdrawal-money-request', [PlayGameController::class, 'Request_money']);
    Route::get('all-transaction', [PlayGameController::class, 'AllTransaction']);
    Route::get('withdrawal-money', [PlayGameController::class, 'WithdrawalMoney']);
    Route::get('add-money-list', [PlayGameController::class, 'AddMoneyList']);
    Route::get('won-money-list', [PlayGameController::class, 'WonMoneyList']);
    Route::get('all-play-game', [PlayGameController::class, 'All_playGame']);
    Route::post('submit-double-game', [PlayGameController::class, 'DoublePlayGame']);
    Route::post('submit-harup-game', [PlayGameController::class, 'HarupPlayGame']);
    Route::get('sub-category', [CategoryControllerUser::class, 'subcategory']);
    Route::get('enter-play-game', [CategoryControllerUser::class, 'play_game']);
    Route::post('calculate-number', [CategoryControllerUser::class, 'crossing_number']);
    Route::get('numbers-history', [PlayGameController::class, 'number_History']);
    Route::get('play_game', [PlayGameController::class, 'Play_game_history']);
    Route::post('play-game-set-bet', [PlayGameController::class, 'playGame']);
    Route::get('statement-user', [AllTransactionController::class, 'All_StateMents']);
    

});

// Admin Routes (Authenticated with Sanctum and check.user.type:admin middleware)
Route::prefix('admin')->middleware(['auth:sanctum', 'check.user.type:admin'])->group(function () {
    // Admin Management
    Route::post('admin-logout', [RegisterControllerRefferal::class, 'admin_logout']);
    Route::get('admin-get', [AdminController::class, 'getAdmin']);
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    // App Settings (QR Code, App Version)
    Route::post('update-qr-code', [AppSettingController::class, 'updateQRCode']);
    Route::post('update-app-version', [AppSettingController::class, 'updateAppVersion']);

    // Category Management
    Route::get('get-all-category-list', [CategoryController::class, 'get_All_Category']);
    Route::post('add-category', [CategoryController::class, 'add_category']);
    Route::get('get-category_details/{category_id}', [CategoryController::class, 'GetCategory_Details']);
    Route::put('update-category/{category_id}', [CategoryController::class, 'update_category']);
    Route::delete('delete-category/{category_id}', [CategoryController::class, 'delete_category']);
    
    Route::get('all-open-number',[CategoryController::class,'AllPlaysGame']);
    Route::get('all-edit-number/{no_id}',[CategoryController::class,'AllPlaysGame_details']);
    Route::put('update-number',[CategoryController::class,'AllPlaysGameUpdate']);
    Route::delete('delete-number',[CategoryController::class,'AllPlaysGameDelete']);
    // Sub-Category Management
    Route::get('get-all-subcategory', [CategoryController::class, 'get_subcategory']);
    Route::post('add-sub-category', [CategoryController::class, 'add_subcategory']);
    Route::get('get-subcategory-details/{category_id}', [CategoryController::class, 'GetSubCategory_Details']);
    Route::put('update-subcategory/{category_id}', [CategoryController::class, 'update_subcategory']);
    Route::delete('delete-subcategory/{category_id}', [CategoryController::class, 'delete_subcategory']);
    Route::put('update-active/{category_id}',[CategoryController::class, 'active_subcategory']);

//new added 

//

    Route::post('get-all-result',[PlayedGameController::class,'PlayGameAmountA']);
    Route::post('get-all-add-result',[PlayedGameController::class,'PlayGameAmountAddMoney']);

    Route::post('update-token',[RegisterControllerRefferal::class,'DeleteToken']);


Route::post('add-new-users',[RegisterControllerRefferal::class,'AdminRegister']);
Route::put('change-password-admin',[RegisterControllerRefferal::class,'change_password_admin']);
Route::delete('delete-add-money', [PlayGameController::class, 'DeleteAddMoney']);
    Route::get('play-games-numbers', [PlayGameController::class, 'PlayGame_Category']);
    Route::get('play-games-number-harup',[PlayGameController::class,'PlayGame_Harup']);



    
    Route::post('add-money-to-users', [PlayedGameController::class, 'Add_Money_To_wallet']);
    //routes for content -change 
        Route::get('home-content-list',[CategoryController::class,'Content_Game']);
        Route::post('home-content-add',[CategoryController::class,'Content_Game_post']);
        Route::get('home-content-details/{content_id}',[CategoryController::class,'Content_Game_details']);
        Route::put('home-content-update/{content_id}',[CategoryController::class,'Content_Game_update']);
        Route::delete('home-content-delete/{content_id}',[CategoryController::class,'Content_Game_delete']);

    Route::get('all-money-added-list',[PlayedGameController::class,'All_Transaction']);
    Route::get('admin-added-money-list', [PlayedGameController::class, 'Admin_Added_Money_List']);
    Route::get('all-transaction/{transaction_id}',[PlayedGameController::class,'Transaction_Details']);
Route::put('transaction-update-id', [PlayedGameController::class, 'Transaction_UpdateS']);

Route::get('play-game-history-user/{user_id}',[PlayedGameController::class, 'User_Playing_Game']);
// Route::put('update-transaction/{transaction_id}', [PlayedGameController::class, 'Transaction_Update']);

    Route::put('result_today', [CategoryController::class, 'result_today']);
    Route::get('admin-dashboard', [PlayedGameController::class, 'AdminDashboard']);
    Route::get('daily-win-loss-stats', [PlayedGameController::class, 'dailyWinLossStats']);

    Route::post('approved-payment',[PlayedGameController::class,'Approved']);
    Route::get('all-withdrawal-list', [PlayedGameController::class, 'all_request_money_list']);
    Route::post('update-withdrawal-status/', [PlayedGameController::class, 'update_withdrawal_req']);
    Route::put('update-status', [CategoryController::class, 'update_status']);
    Route::delete('delete-request/{payment_id}',[PlayedGameController::class,'Played_game_delete']);
    // Transaction and Play Game Management
    Route::get('all-money-added-request', [PlayGameController::class, 'Request_Add_money_list']);
Route::delete('delete-payment-history/{transaction_id}', [PlayGameController::class, 'delete_added_req']);
    
        Route::delete('delete-game/{id}',[PlayedGameController::class,'Delete_Game_History']);
        Route::get('user-referall-list',[PlayedGameController::class,'UserReferalIst']);
        Route::delete('add-money',[PlayGameController::class,'DeleteAddMoney']);
    
    Route::put('user-status',[PlayedGameController::class,'UserStatus']);
    Route::get('get-user-statement',[PlayedGameController::class,'UserHistoryAllLis']);
    Route::get('get-referal_code',[PlayedGameController::class,'UserHistoryAllLisRef']);
    
    Route::delete('game-delete-by-admin/{gameId}',[PlayedGameController::class,'Deletegamehistory']);
    
    

//update numbers for today 

Route::put('result_today', [CategoryController::class, 'result_today']);
    Route::put('update-status', [CategoryController::class, 'update_status']);
    Route::get('all-play-games', [CategoryController::class, 'AllPlayed_Game']);
    Route::get('all-users-list', [AdminController::class, 'AllUsersLists']);
    Route::get('user-details', [AdminController::class, 'user_Details']);
    Route::put('update-users', [AdminController::class, 'Update_users']);
    Route::delete('delete-users', [AdminController::class, 'user_delete']);
    Route::put('payment-confirmation/{payment_id}', [PlayGameController::class, 'confirm_payment']);
    Route::get('money-request-details/{id}', [PlayGameController::class, 'details_payment']);
    Route::post('revoke-number', [PlayedGameController::class, 'revoke_number']);

    Route::post('open-current-number', [PlayedGameController::class, 'played_game']);
    Route::get('audit-logs', [AdminController::class, 'audit_logs']);
    Route::get('deleted-records', [AdminController::class, 'deleted_records']);
    Route::post('restore-record', [AdminController::class, 'restore_record']);
});

// Chat Routes (Accessible by both Users and Admins)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('channels/{channel}/messages', [ChatController::class, 'index']);
    Route::post('channels/{channel}/messages', [ChatController::class, 'store']);
    Route::post('channels/{channel}/upload', [ChatController::class, 'uploadMedia']);
    Route::post('messages/{message}/like', [ChatController::class, 'likeMessage']);
});

