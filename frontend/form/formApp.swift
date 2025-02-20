//
//  formApp.swift
//  form
//
//  Created by David McInnis on 2/10/25.
//

import SwiftUI

@main
struct formApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
