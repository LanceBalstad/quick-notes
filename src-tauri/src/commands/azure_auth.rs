use oauth2::{
    basic::BasicClient, AuthUrl, ClientId, DeviceAuthorizationUrl, Scope, TokenResponse, TokenUrl,
};
use tauri::command;

#[command]
pub async fn login_to_azure() -> Result<String, String> {
    let client_id = ClientId::new("99dade1a-b65d-4672-bd1c-29804d696a8f".to_string());

    let auth_url =
        AuthUrl::new("https://login.microsoftonline.com/common/oauth2/v2.0/authorize".to_string())
            .map_err(|e| e.to_string())?;

    let device_url = DeviceAuthorizationUrl::new(
        "https://login.microsoftonline.com/common/oauth2/v2.0/devicecode".to_string(),
    )
    .map_err(|e| e.to_string())?;

    let token_url =
        TokenUrl::new("https://login.microsoftonline.com/common/oauth2/v2.0/token".to_string())
            .map_err(|e| e.to_string())?;

    let client = BasicClient::new(client_id, None, auth_url, Some(token_url))
        .set_device_authorization_url(device_url);

    let mut req = client.exchange_device_code().map_err(|e| e.to_string())?;

    req = req.add_scope(Scope::new(
        "499b84ac-1321-427f-aa17-267ca6975798/vso.work".to_string(),
    ));

    let details: oauth2::DeviceAuthorizationResponse<oauth2::EmptyExtraDeviceAuthorizationFields> =
        req.request_async(oauth2::reqwest::async_http_client)
            .await
            .map_err(|e| e.to_string())?;

    println!(
        "Go to {} and enter code: {}",
        details.verification_uri().to_string(),
        details.user_code().secret()
    );

    if let Some(uri) = details.verification_uri_complete() {
        println!("Direct link: {}", uri.secret());
    }

    let token = client
        .exchange_device_access_token(&details)
        .request_async(oauth2::reqwest::async_http_client, tokio::time::sleep, None)
        .await
        .map_err(|e| e.to_string())?;

    // Extract access token
    Ok(token.access_token().secret().to_string())
}
