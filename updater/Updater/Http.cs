using System;
using System.Collections.Generic;
using System.Net.Http;

namespace Updater
{
    public static class Http
    {
        public static string Get(string url)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    var responseStringTask = client.GetStringAsync(url);
                    responseStringTask.Wait();
                    var responseString = responseStringTask.Result;
                    return responseString;
                }
            }
            catch (Exception ex)
            {
                // ReSharper disable once LocalizableElement
                Console.WriteLine("Http Get Error: {0} - {1}", url, ex.Message);
                return "";
            }
        }

        public static string Post(string url, Dictionary<string, string> values)
        {
            try
            {
                var content = new FormUrlEncodedContent(values);
                using (var client = new HttpClient())
                {
                    var responseTask = client.PostAsync(url, content);
                    responseTask.Wait();
                    var response = responseTask.Result;
                    var responseStringTask = response.Content.ReadAsStringAsync();
                    responseStringTask.Wait();
                    var responseString = responseStringTask.Result;
                    return responseString;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Http Post Error: {0} - {1}", url, ex.Message);
                return "";
            }
        }
    }
}
